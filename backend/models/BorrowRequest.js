const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  scannedQRCode: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  },
  // Store the transaction ID if approved
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
borrowRequestSchema.index({ user: 1, status: 1 });
borrowRequestSchema.index({ book: 1, status: 1 });
borrowRequestSchema.index({ status: 1, requestedAt: -1 });

// Method to approve request
borrowRequestSchema.methods.approve = async function(reviewedBy) {
  this.status = 'approved';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  return this.save();
};

// Method to reject request
borrowRequestSchema.methods.reject = async function(reviewedBy, reason = null) {
  this.status = 'rejected';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  this.rejectionReason = reason;
  return this.save();
};

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);

