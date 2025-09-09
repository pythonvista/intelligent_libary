const express = require('express');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/transactions/all
// @desc    Get all transactions for admin view
// @access  Staff only
router.get('/all', authenticateToken, requireStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const status = req.query.status || '';

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ borrowDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate additional data for each transaction
    const transactionsWithExtra = transactions.map(transaction => {
      const dueDate = new Date(transaction.dueDate);
      const today = new Date();
      const diffTime = today - dueDate;
      const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      // Calculate fine (e.g., $1 per day overdue)
      const fine = transaction.status === 'overdue' ? daysOverdue * 1 : 0;

      return {
        ...transaction.toJSON(),
        daysOverdue,
        fine
      };
    });

    res.json({
      transactions: transactionsWithExtra,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// @route   POST /api/transactions/borrow/:bookId
// @desc    Borrow a book
// @access  Private
router.post('/borrow/:bookId', authenticateToken, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is not available for borrowing' });
    }

    // Check if user already has this book borrowed
    const existingTransaction = await Transaction.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['active', 'overdue'] }
    });

    if (existingTransaction) {
      return res.status(400).json({ message: 'You already have this book borrowed' });
    }

    // Check user's current borrowed books limit (e.g., max 5 books)
    const userActiveTransactions = await Transaction.countDocuments({
      user: userId,
      status: { $in: ['active', 'overdue'] }
    });

    const borrowLimit = 5;
    if (userActiveTransactions >= borrowLimit) {
      return res.status(400).json({ 
        message: `You have reached the maximum borrowing limit of ${borrowLimit} books` 
      });
    }

    // Create due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create transaction
    const transaction = new Transaction({
      user: userId,
      book: bookId,
      dueDate,
      status: 'active'
    });

    await transaction.save();

    // Update book availability
    await book.borrowBook();

    // Add book to user's borrowed books
    await User.findByIdAndUpdate(userId, {
      $addToSet: { borrowedBooks: bookId }
    });

    // Populate transaction data for response
    await transaction.populate('book', 'title author coverImage');

    res.status(201).json({
      message: 'Book borrowed successfully',
      transaction
    });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ message: 'Failed to borrow book', error: error.message });
  }
});

// @route   POST /api/transactions/return/:bookId
// @desc    Return a borrowed book
// @access  Private
router.post('/return/:bookId', authenticateToken, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Find active transaction
    const transaction = await Transaction.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['active', 'overdue'] }
    }).populate('book', 'title author');

    if (!transaction) {
      return res.status(404).json({ message: 'No active borrowing record found for this book' });
    }

    // Update transaction
    transaction.returnDate = new Date();
    transaction.status = 'returned';
    
    // Calculate fine if overdue
    if (transaction.daysOverdue > 0) {
      transaction.fineAmount = transaction.calculateFine();
    }

    await transaction.save();

    // Update book availability
    const book = await Book.findById(bookId);
    await book.returnBook();

    // Remove book from user's borrowed books
    await User.findByIdAndUpdate(userId, {
      $pull: { borrowedBooks: bookId }
    });

    res.json({
      message: 'Book returned successfully',
      transaction,
      fineAmount: transaction.fineAmount
    });
  } catch (error) {
    console.error('Return error:', error);
    res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
});

// @route   GET /api/transactions/my-books
// @desc    Get user's borrowed books
// @access  Private
router.get('/my-books', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({
      user: userId,
      status: { $in: ['active', 'overdue'] }
    })
    .populate('book', 'title author coverImage subject')
    .sort({ borrowDate: -1 });

    // Add calculated fields
    const borrowedBooks = transactions.map(transaction => ({
      ...transaction.toJSON(),
      daysOverdue: transaction.daysOverdue,
      fine: transaction.calculateFine()
    }));

    res.json({ borrowedBooks });
  } catch (error) {
    console.error('My books error:', error);
    res.status(500).json({ message: 'Failed to fetch borrowed books', error: error.message });
  }
});

// @route   GET /api/transactions/history
// @desc    Get user's borrowing history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const total = await Transaction.countDocuments({ user: userId });

    const transactions = await Transaction.find({ user: userId })
      .populate('book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
});

// @route   POST /api/transactions/renew/:transactionId
// @desc    Renew a borrowed book
// @access  Private
router.post('/renew/:transactionId', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      status: 'active'
    }).populate('book', 'title author');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or not eligible for renewal' });
    }

    await transaction.renew();

    res.json({
      message: 'Book renewed successfully',
      transaction,
      newDueDate: transaction.dueDate
    });
  } catch (error) {
    console.error('Renewal error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/transactions/all
// @desc    Get all transactions (admin/staff)
// @access  Staff only
router.get('/all', authenticateToken, requireStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const search = req.query.search || '';

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const total = await Transaction.countDocuments(query);

    let transactionsQuery = Transaction.find(query)
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Apply search if provided
    if (search) {
      // This would require a more complex aggregation for searching across populated fields
      // For now, we'll search by transaction ID or notes
      query.$or = [
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await transactionsQuery;

    // Add calculated fields
    const enrichedTransactions = transactions.map(transaction => ({
      ...transaction.toJSON(),
      daysOverdue: transaction.daysOverdue,
      fine: transaction.calculateFine()
    }));

    res.json({
      transactions: enrichedTransactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total
    });
  } catch (error) {
    console.error('All transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// @route   GET /api/transactions/overdue
// @desc    Get overdue books
// @access  Staff only
router.get('/overdue', authenticateToken, requireStaff, async (req, res) => {
  try {
    const overdueTransactions = await Transaction.find({
      status: { $in: ['active', 'overdue'] },
      dueDate: { $lt: new Date() }
    })
    .populate('user', 'name email phoneNumber')
    .populate('book', 'title author isbn')
    .sort({ dueDate: 1 });

    // Update status to overdue and calculate fines
    const updatedTransactions = [];
    for (let transaction of overdueTransactions) {
      if (transaction.status === 'active') {
        transaction.status = 'overdue';
        transaction.fineAmount = transaction.calculateFine();
        await transaction.save();
      }
      
      updatedTransactions.push({
        ...transaction.toJSON(),
        daysOverdue: transaction.daysOverdue,
        fine: transaction.calculateFine()
      });
    }

    res.json({ overdueTransactions: updatedTransactions });
  } catch (error) {
    console.error('Overdue transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch overdue transactions', error: error.message });
  }
});

module.exports = router;
