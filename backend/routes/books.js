const express = require('express');
const QRCode = require('qrcode');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireStaff, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/books
// @desc    Get all books with pagination and search
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const subject = req.query.subject || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    // Build sort object
    let sort = {};
    if (search && !req.query.sortBy) {
      sort = { score: { $meta: 'textScore' } };
    } else {
      sort[sortBy] = sortOrder;
    }

    // Execute query
    const books = await Book.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-qrCode'); // Don't expose QR code data in listings

    // Get unique subjects for filtering
    const subjects = await Book.distinct('subject');

    res.json({
      books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBooks: total,
      subjects
    });
  } catch (error) {
    console.error('Books fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
});

// @route   GET /api/books/scan/:qrCode
// @desc    Get book info by QR code
// @access  Public (for scanning)
router.get('/scan/:qrCode', async (req, res) => {
  try {
    const book = await Book.findOne({ qrCode: req.params.qrCode });
    if (!book) {
      return res.status(404).json({ message: 'Book not found for this QR code' });
    }

    res.json({
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        subject: book.subject,
        isAvailable: book.isAvailable,
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies,
        coverImage: book.coverImage
      }
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ message: 'Failed to scan QR code', error: error.message });
  }
});

// @route   GET /api/books/recommendations/:userId
// @desc    Get book recommendations for user (ML-powered)
// @access  Private
router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const algorithm = req.query.algorithm || 'hybrid'; // svd, nmf, tfidf, hybrid
    const n = parseInt(req.query.n) || 10;

    // Get user's borrowed books to understand preferences
    const userTransactions = await Transaction.find({ user: userId })
      .populate('book')
      .limit(50)
      .sort({ createdAt: -1 });

    // Extract subjects from user's history
    const userSubjects = userTransactions
      .map(t => t.book?.subject)
      .filter(Boolean)
      .filter((subject, index, arr) => arr.indexOf(subject) === index);

    // If no history, recommend popular books (cold start)
    if (userSubjects.length === 0) {
      const popularBooks = await Book.find({ isAvailable: true })
        .sort({ borrowCount: -1 })
        .limit(n)
        .select('title author subject coverImage rating borrowCount');

      return res.json({
        recommendations: popularBooks,
        reason: 'Popular books (cold start)',
        algorithm: 'popularity_based',
        ml_powered: false
      });
    }

    // Use ML service for recommendations
    const MLService = require('../services/ml-integration');
    
    // Get all available books for ML processing
    const availableBooks = await Book.find({ isAvailable: true });
    
    // Get ML recommendations
    const mlResult = await MLService.getRecommendations({
      userId,
      books: availableBooks,
      userHistory: userTransactions,
      algorithm,
      n
    });

    // Fetch full book details for recommended books
    const recommendedBookIds = mlResult.recommendations.map(r => r.book_id);
    const recommendedBooks = await Book.find({
      _id: { $in: recommendedBookIds }
    }).select('title author subject coverImage rating borrowCount');

    // Merge scores with book data
    const enrichedRecommendations = mlResult.recommendations.map(rec => {
      const book = recommendedBooks.find(b => b._id.toString() === rec.book_id);
      return {
        ...book?.toObject(),
        ml_score: rec.score,
        ml_algorithm: rec.algorithm
      };
    }).filter(Boolean);

    res.json({
      recommendations: enrichedRecommendations,
      reason: `ML-powered recommendations using ${algorithm} algorithm`,
      algorithm: mlResult.algorithm,
      variant: mlResult.variant,
      ml_powered: true,
      simulated: mlResult.simulated,
      user_interests: userSubjects.join(', ')
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations', error: error.message });
  }
});

// @route   GET /api/books/:id
// @desc    Get single book by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Get related books (same subject)
    const relatedBooks = await Book.find({
      subject: book.subject,
      _id: { $ne: book._id }
    }).limit(4).select('title author coverImage rating');

    res.json({
      book,
      relatedBooks
    });
  } catch (error) {
    console.error('Book fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
});

// @route   POST /api/books
// @desc    Add new book
// @access  Staff only
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const bookData = req.body;
    
    // Generate unique QR code data
    const qrData = `LIBRARY_BOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create book
    const book = new Book({
      ...bookData,
      qrCode: qrData,
      availableCopies: bookData.totalCopies || 1
    });

    await book.save();

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData);

    res.status(201).json({
      message: 'Book added successfully',
      book,
      qrCodeImage
    });
  } catch (error) {
    console.error('Book creation error:', error);
    res.status(500).json({ message: 'Failed to add book', error: error.message });
  }
});

// @route   PUT /api/books/:id
// @desc    Update book
// @access  Staff only
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update book fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'qrCode') {
        book[key] = req.body[key];
      }
    });

    // Ensure available copies don't exceed total copies
    if (book.availableCopies > book.totalCopies) {
      book.availableCopies = book.totalCopies;
    }

    await book.save();

    res.json({
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    console.error('Book update error:', error);
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete book
// @access  Staff only
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book has active transactions
    const activeTransactions = await Transaction.countDocuments({
      book: book._id,
      status: { $in: ['active', 'overdue'] }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete book with active borrowing transactions' 
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Book deletion error:', error);
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
});

// @route   GET /api/books/:id/qr
// @desc    Get QR code for book
// @access  Staff only
router.get('/:id/qr', authenticateToken, requireStaff, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const qrCodeImage = await QRCode.toDataURL(book.qrCode);

    res.json({
      bookTitle: book.title,
      qrCode: book.qrCode,
      qrCodeImage
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
  }
});

module.exports = router;
