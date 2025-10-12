const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const MarketplaceItem = require('../models/MarketplaceItem');
const Service = require('../models/Service');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone(),
  body('preferences.language').optional().isIn(['en', 'fa', 'ar']),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, preferences } = req.body;
    const user = await User.findById(req.user._id);

    // Check if phone is already taken by another user
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) {
      user.phone = phone;
      user.isVerified.phone = false; // Reset verification when phone changes
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
});

// Get user dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's marketplace items
    const marketplaceItems = await MarketplaceItem.find({ seller: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('buyer', 'username avatar');

    // Get user's purchased items
    const purchasedItems = await MarketplaceItem.find({ buyer: userId })
      .sort({ soldAt: -1 })
      .limit(10)
      .populate('seller', 'username avatar');

    // Get user's services
    const services = await Service.find({ provider: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user's service orders
    const serviceOrders = await Service.find({
      'orders.user': userId
    })
    .sort({ 'orders.createdAt': -1 })
    .limit(10);

    // Calculate statistics
    const stats = {
      totalItemsSold: await MarketplaceItem.countDocuments({ seller: userId, status: 'sold' }),
      totalItemsPurchased: await MarketplaceItem.countDocuments({ buyer: userId }),
      totalServicesProvided: await Service.countDocuments({ provider: userId }),
      totalServicesOrdered: await Service.countDocuments({ 'orders.user': userId }),
      totalEarnings: req.user.statistics.totalEarned,
      totalSpent: req.user.statistics.totalSpent,
      gems: req.user.gems,
      walletBalance: req.user.wallet.balance
    };

    res.json({
      success: true,
      dashboard: {
        stats,
        recentMarketplaceItems: marketplaceItems,
        recentPurchases: purchasedItems,
        recentServices: services,
        recentServiceOrders: serviceOrders
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// Get user statistics
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = {
      marketplace: {
        itemsSold: await MarketplaceItem.countDocuments({ seller: userId, status: 'sold' }),
        itemsPurchased: await MarketplaceItem.countDocuments({ buyer: userId }),
        activeListings: await MarketplaceItem.countDocuments({ seller: userId, status: 'active' }),
        totalRevenue: await MarketplaceItem.aggregate([
          { $match: { seller: userId, status: 'sold' } },
          { $group: { _id: null, total: { $sum: '$price.gems' } } }
        ])
      },
      services: {
        servicesProvided: await Service.countDocuments({ provider: userId }),
        servicesOrdered: await Service.countDocuments({ 'orders.user': userId }),
        averageRating: await Service.aggregate([
          { $match: { provider: userId } },
          { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
        ])
      },
      account: {
        gems: req.user.gems,
        walletBalance: req.user.wallet.balance,
        joinDate: req.user.createdAt,
        lastLogin: req.user.statistics.lastLogin,
        loginCount: req.user.statistics.loginCount
      }
    };

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Deactivate account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

module.exports = router;