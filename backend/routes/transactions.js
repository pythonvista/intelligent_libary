const express = require('express');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const BorrowRequest = require('../models/BorrowRequest');
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

// @route   POST /api/transactions/borrow-qr
// @desc    Borrow a book via QR code scan (student scans book QR)
// @access  Private
router.post('/borrow-qr', authenticateToken, async (req, res) => {
  try {
    const { bookQrCode } = req.body;
    const userId = req.user._id;

    if (!bookQrCode) {
      return res.status(400).json({ message: 'Book QR code is required' });
    }

    // Trim whitespace from QR code
    const trimmedQR = String(bookQrCode).trim();

    // Find book by QR code (try exact match first)
    let book = await Book.findOne({ qrCode: trimmedQR });
    
    // If not found, try with old format prefix (for backward compatibility)
    if (!book && !trimmedQR.startsWith('BOOK_') && !trimmedQR.startsWith('LIBRARY_BOOK_')) {
      book = await Book.findOne({ qrCode: `LIBRARY_BOOK_${trimmedQR}` });
    }

    if (!book) {
      return res.status(404).json({ 
        message: `Book not found for this QR code. Please ensure you're scanning a valid book QR code.\n\nScanned: ${trimmedQR.substring(0, 50)}` 
      });
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is not available for borrowing' });
    }

    // Check if user already has this book borrowed
    const existingTransaction = await Transaction.findOne({
      user: userId,
      book: book._id,
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
      book: book._id,
      dueDate,
      status: 'active'
    });

    await transaction.save();

    // Update book availability
    await book.borrowBook();

    // Add book to user's borrowed books
    await User.findByIdAndUpdate(userId, {
      $addToSet: { borrowedBooks: book._id }
    });

    // Populate transaction data for response
    await transaction.populate('book', 'title author coverImage');

    res.status(201).json({
      message: 'Book borrowed successfully via QR code',
      transaction,
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage
      }
    });
  } catch (error) {
    console.error('QR borrow error:', error);
    res.status(500).json({ message: 'Failed to borrow book via QR code', error: error.message });
  }
});

// @route   POST /api/transactions/process-qr
// @desc    Process transaction via dual QR scan (admin scans user + book)
// @access  Staff only
router.post('/process-qr', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { userQrCode, bookQrCode, action } = req.body;

    if (!userQrCode || !bookQrCode) {
      return res.status(400).json({ message: 'Both user and book QR codes are required' });
    }

    if (!action || !['borrow', 'return'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "borrow" or "return"' });
    }

    // Trim whitespace from QR codes
    const trimmedUserQR = String(userQrCode).trim();
    const trimmedBookQR = String(bookQrCode).trim();

    // Find user by QR code
    let user = await User.findOne({ qrCode: trimmedUserQR });
    if (!user) {
      return res.status(404).json({ 
        message: `User not found for this QR code. Please ensure you're scanning a valid student QR code.\n\nScanned: ${trimmedUserQR.substring(0, 50)}` 
      });
    }

    // Find book by QR code (try exact match first)
    let book = await Book.findOne({ qrCode: trimmedBookQR });
    
    // If not found, try with old format prefix (for backward compatibility)
    if (!book && !trimmedBookQR.startsWith('BOOK_') && !trimmedBookQR.startsWith('LIBRARY_BOOK_')) {
      book = await Book.findOne({ qrCode: `LIBRARY_BOOK_${trimmedBookQR}` });
    }

    if (!book) {
      return res.status(404).json({ 
        message: `Book not found for this QR code. Please ensure you're scanning a valid book QR code.\n\nScanned: ${trimmedBookQR.substring(0, 50)}` 
      });
    }

    if (action === 'borrow') {
      // Process borrowing
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: 'Book is not available for borrowing' });
      }

      // Check if user already has this book borrowed
      const existingTransaction = await Transaction.findOne({
        user: user._id,
        book: book._id,
        status: { $in: ['active', 'overdue'] }
      });

      if (existingTransaction) {
        return res.status(400).json({ message: 'User already has this book borrowed' });
      }

      // Check user's current borrowed books limit
      const userActiveTransactions = await Transaction.countDocuments({
        user: user._id,
        status: { $in: ['active', 'overdue'] }
      });

      const borrowLimit = 5;
      if (userActiveTransactions >= borrowLimit) {
        return res.status(400).json({ 
          message: `User has reached the maximum borrowing limit of ${borrowLimit} books` 
        });
      }

      // Create due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create transaction
      const transaction = new Transaction({
        user: user._id,
        book: book._id,
        dueDate,
        status: 'active'
      });

      await transaction.save();

      // Update book availability
      await book.borrowBook();

      // Add book to user's borrowed books
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { borrowedBooks: book._id }
      });

      await transaction.populate('book', 'title author coverImage');
      await transaction.populate('user', 'name email');

      return res.status(201).json({
        message: `Book borrowed successfully for ${user.name}`,
        action: 'borrow',
        transaction,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        book: {
          _id: book._id,
          title: book.title,
          author: book.author
        }
      });
    } else if (action === 'return') {
      // Process returning
      const transaction = await Transaction.findOne({
        user: user._id,
        book: book._id,
        status: { $in: ['active', 'overdue'] }
      })
      .populate('book', 'title author')
      .populate('user', 'name email');

      if (!transaction) {
        return res.status(404).json({ 
          message: 'No active borrowing record found for this user and book combination' 
        });
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
      await book.returnBook();

      // Remove book from user's borrowed books
      await User.findByIdAndUpdate(user._id, {
        $pull: { borrowedBooks: book._id }
      });

      return res.json({
        message: `Book returned successfully by ${user.name}`,
        action: 'return',
        transaction,
        fineAmount: transaction.fineAmount,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        book: {
          _id: book._id,
          title: book.title,
          author: book.author
        }
      });
    }
  } catch (error) {
    console.error('QR process error:', error);
    res.status(500).json({ message: 'Failed to process QR transaction', error: error.message });
  }
});

// @route   POST /api/transactions/borrow-request
// @desc    Create a borrow request (user scans QR to verify)
// @access  Private
router.post('/borrow-request', authenticateToken, async (req, res) => {
  try {
    const { bookId, scannedQRCode } = req.body;
    const userId = req.user._id;

    if (!bookId || !scannedQRCode) {
      return res.status(400).json({ message: 'Book ID and scanned QR code are required' });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Trim whitespace from scanned QR
    const trimmedQR = String(scannedQRCode).trim();

    // Verify the scanned QR code matches the book's QR code
    if (book.qrCode !== trimmedQR) {
      return res.status(400).json({ 
        message: 'QR code mismatch. Please scan the QR code from the physical book you want to borrow.',
        expectedQR: book.qrCode,
        scannedQR: trimmedQR
      });
    }

    // Check if book is available
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

    // Check if there's already a pending request for this user and book
    const existingRequest = await BorrowRequest.findOne({
      user: userId,
      book: bookId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this book. Please wait for admin approval.' 
      });
    }

    // Check user's current borrowed books limit
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

    // Create borrow request
    const borrowRequest = new BorrowRequest({
      user: userId,
      book: bookId,
      scannedQRCode: trimmedQR,
      status: 'pending'
    });

    await borrowRequest.save();

    // Populate for response
    await borrowRequest.populate('book', 'title author coverImage');
    await borrowRequest.populate('user', 'name email');

    res.status(201).json({
      message: 'Borrow request submitted successfully. Waiting for admin approval.',
      request: borrowRequest
    });
  } catch (error) {
    console.error('Borrow request error:', error);
    res.status(500).json({ message: 'Failed to create borrow request', error: error.message });
  }
});

// @route   GET /api/transactions/borrow-requests
// @desc    Get all borrow requests (admin)
// @access  Staff only
router.get('/borrow-requests', authenticateToken, requireStaff, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = { status };
    const total = await BorrowRequest.countDocuments(query);

    const requests = await BorrowRequest.find(query)
      .populate('user', 'name email')
      .populate('book', 'title author coverImage isbn')
      .populate('reviewedBy', 'name')
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      requests,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRequests: total
    });
  } catch (error) {
    console.error('Get borrow requests error:', error);
    res.status(500).json({ message: 'Failed to fetch borrow requests', error: error.message });
  }
});

// @route   POST /api/transactions/borrow-requests/:requestId/approve
// @desc    Approve a borrow request
// @access  Staff only
router.post('/borrow-requests/:requestId/approve', authenticateToken, requireStaff, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const reviewerId = req.user._id;

    const borrowRequest = await BorrowRequest.findById(requestId)
      .populate('user', 'name email')
      .populate('book', 'title author');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `Request has already been ${borrowRequest.status}` 
      });
    }

    // Check if book is still available
    const book = await Book.findById(borrowRequest.book._id);
    if (book.availableCopies <= 0) {
      await borrowRequest.reject(reviewerId, 'Book is no longer available');
      return res.status(400).json({ 
        message: 'Book is no longer available. Request has been rejected.' 
      });
    }

    // Create due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create transaction
    const transaction = new Transaction({
      user: borrowRequest.user._id,
      book: borrowRequest.book._id,
      dueDate,
      status: 'active'
    });

    await transaction.save();

    // Update book availability
    await book.borrowBook();

    // Add book to user's borrowed books
    await User.findByIdAndUpdate(borrowRequest.user._id, {
      $addToSet: { borrowedBooks: borrowRequest.book._id }
    });

    // Update request
    borrowRequest.transaction = transaction._id;
    await borrowRequest.approve(reviewerId);

    // Populate for response
    await borrowRequest.populate('book', 'title author coverImage');
    await borrowRequest.populate('user', 'name email');

    res.json({
      message: 'Borrow request approved successfully',
      request: borrowRequest,
      transaction
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Failed to approve request', error: error.message });
  }
});

// @route   POST /api/transactions/borrow-requests/:requestId/reject
// @desc    Reject a borrow request
// @access  Staff only
router.post('/borrow-requests/:requestId/reject', authenticateToken, requireStaff, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const reviewerId = req.user._id;
    const { reason } = req.body;

    const borrowRequest = await BorrowRequest.findById(requestId)
      .populate('user', 'name email')
      .populate('book', 'title author');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `Request has already been ${borrowRequest.status}` 
      });
    }

    // Reject the request
    await borrowRequest.reject(reviewerId, reason || null);

    // Populate for response
    await borrowRequest.populate('book', 'title author coverImage');
    await borrowRequest.populate('user', 'name email');

    res.json({
      message: 'Borrow request rejected',
      request: borrowRequest
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
});

// @route   GET /api/transactions/my-requests
// @desc    Get user's borrow requests
// @access  Private
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await BorrowRequest.find({ user: userId })
      .populate('book', 'title author coverImage')
      .populate('reviewedBy', 'name')
      .sort({ requestedAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

module.exports = router;
