const express = require('express');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireStaff, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Staff only
router.get('/dashboard', authenticateToken, requireStaff, async (req, res) => {
  try {
    // Get current date for time-based queries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Parallel queries for dashboard stats
    const [
      totalBooks,
      totalUsers,
      activeTransactions,
      overdueTransactions,
      thisMonthTransactions,
      thisWeekTransactions,
      popularBooks,
      recentUsers,
      libraryStats
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Transaction.countDocuments({ status: 'active' }),
      Transaction.countDocuments({ status: 'overdue' }),
      Transaction.countDocuments({ 
        createdAt: { $gte: startOfMonth },
        status: { $in: ['active', 'returned', 'overdue'] }
      }),
      Transaction.countDocuments({ 
        createdAt: { $gte: startOfWeek },
        status: { $in: ['active', 'returned', 'overdue'] }
      }),
      Book.find().sort({ borrowCount: -1 }).limit(5).select('title author borrowCount'),
      User.find({ role: 'patron' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Book.aggregate([
        {
          $group: {
            _id: '$subject',
            count: { $sum: 1 },
            available: { $sum: { $cond: [{ $gt: ['$availableCopies', 0] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate availability rate
    const totalAvailable = await Book.countDocuments({ availableCopies: { $gt: 0 } });
    const availabilityRate = totalBooks > 0 ? ((totalAvailable / totalBooks) * 100).toFixed(1) : 0;

    res.json({
      overview: {
        totalBooks,
        totalUsers,
        activeTransactions,
        overdueTransactions,
        availabilityRate: `${availabilityRate}%`
      },
      activity: {
        thisMonthTransactions,
        thisWeekTransactions
      },
      popularBooks,
      recentUsers,
      libraryStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Staff only
router.get('/users', authenticateToken, requireStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .populate('borrowedBooks', 'title author')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['patron', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/deactivate user
// @access  Admin only
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has active transactions
    if (!isActive) {
      const activeTransactions = await Transaction.countDocuments({
        user: userId,
        status: { $in: ['active', 'overdue'] }
      });

      if (activeTransactions > 0) {
        return res.status(400).json({ 
          message: 'Cannot deactivate user with active book borrowings' 
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

// @route   GET /api/admin/reports/popular-books
// @desc    Get popular books report
// @access  Staff only
router.get('/reports/popular-books', authenticateToken, requireStaff, async (req, res) => {
  try {
    const period = req.query.period || '30'; // days
    const limit = parseInt(req.query.limit) || 10;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const popularBooks = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['active', 'returned', 'overdue'] }
        }
      },
      {
        $group: {
          _id: '$book',
          borrowCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      {
        $unwind: '$bookDetails'
      },
      {
        $project: {
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          subject: '$bookDetails.subject',
          borrowCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { borrowCount: -1 }
      },
      {
        $limit: limit
      }
    ]);

    res.json({ popularBooks, period: `${period} days` });
  } catch (error) {
    console.error('Popular books report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// @route   GET /api/admin/reports/user-activity
// @desc    Get user activity report
// @access  Staff only
router.get('/reports/user-activity', authenticateToken, requireStaff, async (req, res) => {
  try {
    const period = req.query.period || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const userActivity = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalBorrows: { $sum: 1 },
          activeBorrows: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          overdueBorrows: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          name: '$userDetails.name',
          email: '$userDetails.email',
          role: '$userDetails.role',
          totalBorrows: 1,
          activeBorrows: 1,
          overdueBorrows: 1
        }
      },
      {
        $sort: { totalBorrows: -1 }
      }
    ]);

    res.json({ userActivity, period: `${period} days` });
  } catch (error) {
    console.error('User activity report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// @route   POST /api/admin/bulk-import
// @desc    Bulk import books
// @access  Staff only
router.post('/bulk-import', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of books' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < books.length; i++) {
      try {
        const bookData = books[i];
        
        // Generate unique QR code
        const qrData = `LIBRARY_BOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const book = new Book({
          ...bookData,
          qrCode: qrData,
          availableCopies: bookData.totalCopies || 1
        });

        await book.save();
        results.success.push({ index: i, book: book.toJSON() });
      } catch (error) {
        results.errors.push({ 
          index: i, 
          error: error.message,
          book: books[i]
        });
      }
    }

    res.json({
      message: 'Bulk import completed',
      results,
      summary: {
        total: books.length,
        success: results.success.length,
        errors: results.errors.length
      }
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Failed to import books', error: error.message });
  }
});

module.exports = router;
