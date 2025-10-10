const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patron', 'staff', 'admin'],
    default: 'patron'
  },
  borrowedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  preferences: {
    subjects: [{
      type: String,
      trim: true
    }],
    // ML-specific user behavior features
    behaviorProfile: {
      type: String,
      enum: ['frequent', 'moderate', 'casual', 'power'],
      default: 'casual'
    },
    avgBorrowDuration: {
      type: Number,
      default: 14
    },
    activityLevel: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    // ML interaction features
    mlProfile: {
      latentFactors: [Number], // SVD/NMF user embedding
      preferredAuthors: [String],
      readingHistory: [{
        subject: String,
        count: Number,
        lastBorrowed: Date
      }],
      diversityScore: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
      }
    }
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
