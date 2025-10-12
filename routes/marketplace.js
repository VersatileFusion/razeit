const express = require('express');
const { body, validationResult, query } = require('express-validator');
const MarketplaceItem = require('../models/MarketplaceItem');
const User = require('../models/User');
const { authMiddleware, moderatorMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for item images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/marketplace/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all marketplace items with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isIn(['csgo', 'dota2', 'tf2', 'rust', 'other']),
  query('itemType').optional().isIn(['weapon', 'skin', 'knife', 'glove', 'sticker', 'case', 'key', 'other']),
  query('rarity').optional().isIn(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('sortBy').optional().isIn(['price', 'createdAt', 'views', 'likes']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
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
      category,
      itemType,
      rarity,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (itemType) filter.itemType = itemType;
    if (rarity) filter.rarity = rarity;
    if (minPrice || maxPrice) {
      filter['price.gems'] = {};
      if (minPrice) filter['price.gems'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.gems'].$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MarketplaceItem.find(filter)
      .populate('seller', 'username avatar')
      .sort(sort)
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

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id)
      .populate('seller', 'username avatar statistics')
      .populate('buyer', 'username avatar');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment view count
    item.views += 1;
    await item.save();

    res.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get item'
    });
  }
});

// Create new marketplace item
router.post('/', authMiddleware, upload.array('images', 5), [
  body('title').notEmpty().trim().isLength({ max: 100 }),
  body('description').notEmpty().trim().isLength({ max: 1000 }),
  body('category').isIn(['csgo', 'dota2', 'tf2', 'rust', 'other']),
  body('game').notEmpty().trim(),
  body('itemType').isIn(['weapon', 'skin', 'knife', 'glove', 'sticker', 'case', 'key', 'other']),
  body('rarity').optional().isIn(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  body('condition').optional().isIn(['factory-new', 'minimal-wear', 'field-tested', 'well-worn', 'battle-scarred']),
  body('price.gems').isNumeric().isFloat({ min: 0 }),
  body('price.usd').isNumeric().isFloat({ min: 0 }),
  body('price.rial').isNumeric().isFloat({ min: 0 }),
  body('steamItemId').optional().trim(),
  body('steamMarketUrl').optional().isURL(),
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
      game,
      itemType,
      rarity = 'common',
      condition = 'field-tested',
      price,
      steamItemId,
      steamMarketUrl,
      tags = []
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map((file, index) => ({
      url: `/uploads/marketplace/${file.filename}`,
      alt: `${title} image ${index + 1}`,
      isPrimary: index === 0
    })) : [];

    const item = new MarketplaceItem({
      title,
      description,
      category,
      game,
      itemType,
      rarity,
      condition,
      images,
      price,
      seller: req.user._id,
      steamItemId,
      steamMarketUrl,
      tags
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item listed successfully',
      item
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item listing'
    });
  }
});

// Update marketplace item
router.put('/:id', authMiddleware, upload.array('images', 5), [
  body('title').optional().notEmpty().trim().isLength({ max: 100 }),
  body('description').optional().notEmpty().trim().isLength({ max: 1000 }),
  body('price.gems').optional().isNumeric().isFloat({ min: 0 }),
  body('price.usd').optional().isNumeric().isFloat({ min: 0 }),
  body('price.rial').optional().isNumeric().isFloat({ min: 0 }),
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

    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is the seller or admin/moderator
    if (item.seller.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    // Check if item is still available for editing
    if (item.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sold or cancelled item'
      });
    }

    const { title, description, price, tags } = req.body;

    // Update fields
    if (title) item.title = title;
    if (description) item.description = description;
    if (price) item.price = price;
    if (tags) item.tags = tags;

    // Process new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/marketplace/${file.filename}`,
        alt: `${item.title} image ${index + 1}`,
        isPrimary: index === 0
      }));
      item.images = [...item.images, ...newImages];
    }

    await item.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item'
    });
  }
});

// Purchase item
router.post('/:id/purchase', authMiddleware, [
  body('paymentMethod').isIn(['gems', 'usd', 'rial']),
  body('paymentDetails').optional().isObject()
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

    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Item is no longer available'
      });
    }

    if (item.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase your own item'
      });
    }

    const { paymentMethod, paymentDetails } = req.body;
    const buyer = await User.findById(req.user._id);
    const seller = await User.findById(item.seller);

    // Check payment
    const price = item.price[paymentMethod];
    if (paymentMethod === 'gems') {
      if (buyer.gems < price) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient gems'
        });
      }
    } else {
      // Process external payment
      const paymentResult = await processExternalPayment(paymentMethod, price, paymentDetails);
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        });
      }
    }

    // Process transaction
    if (paymentMethod === 'gems') {
      buyer.gems -= price;
      seller.gems += price;
      seller.statistics.totalEarned += price;
      buyer.statistics.totalSpent += price;
    }

    // Update item status
    item.status = 'sold';
    item.soldAt = new Date();
    item.buyer = buyer._id;

    // Update statistics
    seller.statistics.itemsSold += 1;
    buyer.statistics.itemsPurchased += 1;

    await Promise.all([
      item.save(),
      buyer.save(),
      seller.save()
    ]);

    res.json({
      success: true,
      message: 'Item purchased successfully',
      transaction: {
        itemId: item._id,
        seller: seller.username,
        buyer: buyer.username,
        price: price,
        paymentMethod: paymentMethod,
        transactionId: paymentMethod === 'gems' ? `gems_${Date.now()}` : paymentResult.transactionId
      }
    });

  } catch (error) {
    console.error('Purchase item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase item'
    });
  }
});

// Like/Unlike item
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const existingLike = item.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      item.likes = item.likes.filter(like => 
        like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      item.likes.push({
        user: req.user._id,
        createdAt: new Date()
      });
    }

    await item.save();

    res.json({
      success: true,
      message: existingLike ? 'Item unliked' : 'Item liked',
      likesCount: item.likes.length,
      isLiked: !existingLike
    });

  } catch (error) {
    console.error('Like item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike item'
    });
  }
});

// Cancel item listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is the seller or admin/moderator
    if (item.seller.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    if (item.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sold item'
      });
    }

    item.status = 'cancelled';
    await item.save();

    res.json({
      success: true,
      message: 'Item listing cancelled'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel item listing'
    });
  }
});

// Get user's marketplace items
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'active', page = 1, limit = 20 } = req.query;

    const filter = { seller: userId };
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MarketplaceItem.find(filter)
      .populate('buyer', 'username avatar')
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
    console.error('Get user items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user items'
    });
  }
});

// Helper function for external payment processing
async function processExternalPayment(method, amount, details) {
  // This would integrate with payment gateway (Stripe, PayPal, etc.)
  return {
    success: true,
    transactionId: `ext_${method}_${Date.now()}`
  };
}

module.exports = router;