const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost'],
    default: 'active'
  },
  renewalCount: {
    type: Number,
    default: 0,
    max: 3
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  // ML-specific transaction features for temporal analysis
  mlFeatures: {
    borrowDuration: {
      type: Number,
      default: 14
    },
    userActivityScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    subjectMatch: {
      type: Boolean,
      default: false
    },
    temporalWeight: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    // Used for A/B testing
    recommendationAlgorithm: {
      type: String,
      enum: ['svd', 'nmf', 'tfidf', 'hybrid', 'popularity', 'manual'],
      default: 'manual'
    },
    wasRecommended: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });

// Virtual for days overdue
transactionSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'overdue' && this.status !== 'active') return 0;
  if (this.returnDate) return 0;
  
  const today = new Date();
  const diffTime = today - this.dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to calculate fine
transactionSchema.methods.calculateFine = function() {
  const daysOverdue = this.daysOverdue;
  if (daysOverdue <= 0) return 0;
  
  const finePerDay = 1; // $1 per day
  const maxFine = 50; // Maximum fine of $50
  
  return Math.min(daysOverdue * finePerDay, maxFine);
};

// Method to renew transaction
transactionSchema.methods.renew = function() {
  if (this.renewalCount >= 3) {
    throw new Error('Maximum renewal limit reached');
  }
  if (this.status !== 'active') {
    throw new Error('Cannot renew a returned or overdue book');
  }
  
  this.renewalCount += 1;
  this.dueDate = new Date(this.dueDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // Add 14 days
  return this.save();
};

// Pre-save middleware to update status
transactionSchema.pre('save', function(next) {
  if (this.returnDate) {
    this.status = 'returned';
  } else if (new Date() > this.dueDate && this.status === 'active') {
    this.status = 'overdue';
    this.fineAmount = this.calculateFine();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
