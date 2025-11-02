const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate unique QR code for user
    const qrData = `STUDENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      address,
      role: 'patron',
      qrCode: qrData
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('borrowedBooks', 'title author dueDate')
      .select('-password');

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, address, preferences } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (preferences) user.preferences = preferences;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

// @route   GET /api/auth/my-qr
// @desc    Get user's QR code
// @access  Private
router.get('/my-qr', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user doesn't have a QR code yet, generate one
    if (!user.qrCode) {
      const qrData = `STUDENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user.qrCode = qrData;
      await user.save();
    }

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(user.qrCode);

    res.json({
      name: user.name,
      email: user.email,
      qrCode: user.qrCode,
      qrCodeImage
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
  }
});

// @route   GET /api/auth/scan-user/:qrCode
// @desc    Get user info by QR code (staff only)
// @access  Private (staff/admin)
router.get('/scan-user/:qrCode', authenticateToken, async (req, res) => {
  try {
    // Verify staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const user = await User.findOne({ qrCode: req.params.qrCode })
      .select('-password')
      .populate({
        path: 'borrowedBooks',
        select: 'title author coverImage'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found for this QR code' });
    }

    res.json({ user });
  } catch (error) {
    console.error('User QR scan error:', error);
    res.status(500).json({ message: 'Failed to scan user QR code', error: error.message });
  }
});

module.exports = router;
