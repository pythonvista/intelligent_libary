const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: Number
  },
  pages: {
    type: Number
  },
  language: {
    type: String,
    default: 'English'
  },
  coverImage: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  totalCopies: {
    type: Number,
    default: 1,
    min: 1
  },
  availableCopies: {
    type: Number,
    default: 1,
    min: 0
  },
  location: {
    shelf: String,
    section: String,
    floor: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  borrowCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  subject: 'text', 
  description: 'text',
  tags: 'text'
});

// Virtual for availability status
bookSchema.virtual('availabilityStatus').get(function() {
  if (this.availableCopies > 0) return 'available';
  if (this.availableCopies === 0) return 'checked_out';
  return 'unavailable';
});

// Method to borrow a book
bookSchema.methods.borrowBook = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    this.borrowCount += 1;
    return this.save();
  }
  throw new Error('No available copies to borrow');
};

// Method to return a book
bookSchema.methods.returnBook = function() {
  if (this.availableCopies < this.totalCopies) {
    this.availableCopies += 1;
    return this.save();
  }
  throw new Error('All copies are already returned');
};

module.exports = mongoose.model('Book', bookSchema);
