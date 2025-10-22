const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const MarketplaceItem = require('../models/MarketplaceItem');
const Service = require('../models/Service');
const Gem = require('../models/Gem');
const Wheel = require('../models/Wheel');
const WheelToken = require('../models/WheelToken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalItems,
      soldItems,
      totalServices,
      totalGems,
      totalWheels,
      recentUsers,
      recentItems,
      recentServices
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      MarketplaceItem.countDocuments(),
      MarketplaceItem.countDocuments({ status: 'sold' }),
      Service.countDocuments(),
      Gem.countDocuments({ isActive: true }),
      Wheel.countDocuments({ isActive: true }),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
      MarketplaceItem.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'username'),
      Service.find().sort({ createdAt: -1 }).limit(5).populate('provider', 'username')
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      marketplace: {
        totalItems,
        soldItems,
        activeItems: totalItems - soldItems
      },
      services: {
        total: totalServices
      },
      gems: {
        total: totalGems
      },
      wheels: {
        total: totalWheels
      }
    };

    res.json({
      success: true,
      dashboard: {
        stats,
        recentUsers,
        recentItems,
        recentServices
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// User management
router.get('/users', authMiddleware, adminMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'admin', 'moderator']),
  query('status').optional().isIn(['active', 'inactive']),
  query('search').optional().trim()
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

    const {
      page = 1,
      limit = 20,
      role,
      status,
      search
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Update user role
router.put('/users/:id/role', authMiddleware, adminMiddleware, [
  body('role').isIn(['user', 'admin', 'moderator'])
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

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Activate/Deactivate user
router.put('/users/:id/status', authMiddleware, adminMiddleware, [
  body('isActive').isBoolean()
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

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Add/Remove gems from user
router.put('/users/:id/gems', authMiddleware, adminMiddleware, [
  body('amount').isInt(),
  body('action').isIn(['add', 'remove']),
  body('reason').notEmpty().trim()
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

    const { id } = req.params;
    const { amount, action, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (action === 'add') {
      user.gems += amount;
    } else {
      if (user.gems < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient gems to remove'
        });
      }
      user.gems -= amount;
    }

    await user.save();

    res.json({
      success: true,
      message: `${amount} gems ${action === 'add' ? 'added to' : 'removed from'} user`,
      user: {
        id: user._id,
        username: user.username,
        gems: user.gems
      },
      reason
    });

  } catch (error) {
    console.error('Update user gems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user gems'
    });
  }
});

// Marketplace management
router.get('/marketplace', authMiddleware, adminMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'sold', 'cancelled', 'pending']),
  query('category').optional().isIn(['csgo', 'dota2', 'tf2', 'rust', 'other'])
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

    const {
      page = 1,
      limit = 20,
      status,
      category
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MarketplaceItem.find(filter)
      .populate('seller', 'username email')
      .populate('buyer', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalItems = await MarketplaceItem.countDocuments(filter);

    res.json({
      success: true,
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems,
        hasNext: skip + items.length < totalItems,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get marketplace items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get marketplace items'
    });
  }
});

// Update marketplace item status
router.put('/marketplace/:id/status', authMiddleware, adminMiddleware, [
  body('status').isIn(['active', 'sold', 'cancelled', 'pending']),
  body('reason').optional().trim()
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

    const { id } = req.params;
    const { status, reason } = req.body;

    const item = await MarketplaceItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.status = status;
    await item.save();

    res.json({
      success: true,
      message: 'Item status updated successfully',
      item: {
        id: item._id,
        title: item.title,
        status: item.status,
        seller: item.seller
      },
      reason
    });

  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status'
    });
  }
});

// Create marketplace item (Admin)
router.post('/marketplace', authMiddleware, adminMiddleware, [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('category').isIn(['csgo', 'dota2', 'tf2', 'rust', 'other']),
  body('itemType').isIn(['weapon', 'skin', 'knife', 'glove', 'sticker', 'case', 'key', 'other']),
  body('rarity').isIn(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  body('condition').isIn(['factory-new', 'minimal-wear', 'field-tested', 'well-worn', 'battle-scarred']),
  body('price.gems').isInt({ min: 0 }),
  body('price.usd').isFloat({ min: 0 }),
  body('price.rial').isInt({ min: 0 }),
  body('seller').isMongoId(),
  body('images').optional().isArray(),
  body('tags').optional().isArray()
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

    const {
      title,
      description,
      category,
      itemType,
      rarity,
      condition,
      price,
      seller,
      images = [],
      tags = [],
      steamItemId,
      steamMarketUrl
    } = req.body;

    // Verify seller exists
    const sellerUser = await User.findById(seller);
    if (!sellerUser) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const item = new MarketplaceItem({
      title,
      description,
      category,
      itemType,
      rarity,
      condition,
      price,
      seller,
      images,
      tags,
      steamItemId,
      steamMarketUrl,
      status: 'active',
      views: 0,
      likes: []
    });

    await item.save();
    await item.populate('seller', 'username email');

    res.status(201).json({
      success: true,
      message: 'Marketplace item created successfully',
      item
    });

  } catch (error) {
    console.error('Create marketplace item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create marketplace item'
    });
  }
});

// Delete marketplace item (Admin)
router.delete('/marketplace/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MarketplaceItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await MarketplaceItem.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Marketplace item deleted successfully',
      item: {
        id: item._id,
        title: item.title
      }
    });

  } catch (error) {
    console.error('Delete marketplace item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete marketplace item'
    });
  }
});

// Services management
router.get('/services', authMiddleware, adminMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('category').optional().isIn(['boosting', 'coaching', 'account', 'items', 'other'])
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

    const {
      page = 1,
      limit = 20,
      status,
      category
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .populate('provider', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalServices = await Service.countDocuments(filter);

    res.json({
      success: true,
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalServices / parseInt(limit)),
        totalServices,
        hasNext: skip + services.length < totalServices,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services'
    });
  }
});

// Update service status
router.put('/services/:id/status', authMiddleware, adminMiddleware, [
  body('status').isIn(['active', 'inactive', 'suspended']),
  body('reason').optional().trim()
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

    const { id } = req.params;
    const { status, reason } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.status = status;
    await service.save();

    res.json({
      success: true,
      message: 'Service status updated successfully',
      service: {
        id: service._id,
        title: service.title,
        status: service.status,
        provider: service.provider
      },
      reason
    });

  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service status'
    });
  }
});

// System settings
router.get('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // This would typically come from a Settings model
    const settings = {
      platform: {
        name: 'RaZeit Gaming Platform',
        version: '1.0.0',
        maintenanceMode: false,
        registrationEnabled: true
      },
      gems: {
        defaultExchangeRate: {
          usd: 0.01,
          rial: 500
        },
        minPurchase: 100,
        maxPurchase: 10000
      },
      marketplace: {
        commissionRate: 5, // 5%
        maxImagesPerItem: 5,
        autoApproveItems: true
      },
      wheels: {
        maxDailySpins: 10,
        defaultCooldownMinutes: 60
      }
    };

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
});

// Update system settings
router.put('/settings', authMiddleware, adminMiddleware, [
  body('platform').optional().isObject(),
  body('gems').optional().isObject(),
  body('marketplace').optional().isObject(),
  body('wheels').optional().isObject()
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

    const settings = req.body;

    // This would typically update a Settings model
    // For now, we'll just return success

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

module.exports = router;