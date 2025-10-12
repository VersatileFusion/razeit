const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Service = require('../models/Service');
const User = require('../models/User');
const { authMiddleware, moderatorMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for service images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/services/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all services with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isIn(['boosting', 'coaching', 'account', 'items', 'other']),
  query('game').optional().trim(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('sortBy').optional().isIn(['price', 'rating', 'createdAt']),
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
      game,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (game) filter.game = { $regex: game, $options: 'i' };
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

    const services = await Service.find(filter)
      .populate('provider', 'username avatar statistics')
      .sort(sort)
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

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'username avatar statistics')
      .populate('reviews.user', 'username avatar');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service'
    });
  }
});

// Create new service
router.post('/', authMiddleware, upload.array('images', 5), [
  body('title').notEmpty().trim().isLength({ max: 100 }),
  body('description').notEmpty().trim().isLength({ max: 1000 }),
  body('category').isIn(['boosting', 'coaching', 'account', 'items', 'other']),
  body('game').notEmpty().trim(),
  body('price.gems').isNumeric().isFloat({ min: 0 }),
  body('price.usd').isNumeric().isFloat({ min: 0 }),
  body('price.rial').isNumeric().isFloat({ min: 0 }),
  body('duration').isIn(['hourly', 'daily', 'weekly', 'monthly', 'one-time']),
  body('estimatedTime').notEmpty().trim(),
  body('requirements').optional().isArray(),
  body('deliverables').optional().isArray(),
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
      price,
      duration,
      estimatedTime,
      requirements = [],
      deliverables = [],
      tags = []
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map((file, index) => ({
      url: `/uploads/services/${file.filename}`,
      alt: `${title} image ${index + 1}`
    })) : [];

    const service = new Service({
      title,
      description,
      category,
      game,
      price,
      duration,
      estimatedTime,
      requirements,
      deliverables,
      images,
      tags,
      provider: req.user._id
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// Update service
router.put('/:id', authMiddleware, upload.array('images', 5), [
  body('title').optional().notEmpty().trim().isLength({ max: 100 }),
  body('description').optional().notEmpty().trim().isLength({ max: 1000 }),
  body('price.gems').optional().isNumeric().isFloat({ min: 0 }),
  body('price.usd').optional().isNumeric().isFloat({ min: 0 }),
  body('price.rial').optional().isNumeric().isFloat({ min: 0 }),
  body('estimatedTime').optional().notEmpty().trim(),
  body('requirements').optional().isArray(),
  body('deliverables').optional().isArray(),
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

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider or admin/moderator
    if (service.provider.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    const {
      title,
      description,
      price,
      estimatedTime,
      requirements,
      deliverables,
      tags
    } = req.body;

    // Update fields
    if (title) service.title = title;
    if (description) service.description = description;
    if (price) service.price = price;
    if (estimatedTime) service.estimatedTime = estimatedTime;
    if (requirements) service.requirements = requirements;
    if (deliverables) service.deliverables = deliverables;
    if (tags) service.tags = tags;

    // Process new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/services/${file.filename}`,
        alt: `${service.title} image ${index + 1}`
      }));
      service.images = [...service.images, ...newImages];
    }

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// Order service
router.post('/:id/order', authMiddleware, [
  body('paymentMethod').isIn(['gems', 'usd', 'rial']),
  body('specialInstructions').optional().trim(),
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

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Service is not available'
      });
    }

    if (service.provider.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot order your own service'
      });
    }

    const { paymentMethod, specialInstructions, paymentDetails } = req.body;
    const buyer = await User.findById(req.user._id);
    const provider = await User.findById(service.provider);

    // Check payment
    const price = service.price[paymentMethod];
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
      provider.gems += price;
      provider.statistics.totalEarned += price;
      buyer.statistics.totalSpent += price;
    }

    // Add order to service
    service.orders.push({
      user: buyer._id,
      status: 'pending',
      specialInstructions,
      createdAt: new Date()
    });

    // Update statistics
    provider.statistics.servicesProvided += 1;
    buyer.statistics.servicesOrdered += 1;

    await Promise.all([
      service.save(),
      buyer.save(),
      provider.save()
    ]);

    res.json({
      success: true,
      message: 'Service ordered successfully',
      order: {
        serviceId: service._id,
        provider: provider.username,
        buyer: buyer.username,
        price: price,
        paymentMethod: paymentMethod,
        status: 'pending',
        transactionId: paymentMethod === 'gems' ? `gems_${Date.now()}` : paymentResult.transactionId
      }
    });

  } catch (error) {
    console.error('Order service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to order service'
    });
  }
});

// Update order status (provider only)
router.put('/:id/orders/:orderId/status', authMiddleware, [
  body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  body('notes').optional().trim()
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

    const { id, orderId } = req.params;
    const { status, notes } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider or admin/moderator
    if (service.provider.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    const order = service.orders.id(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (notes) order.notes = notes;
    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await service.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        status: order.status,
        notes: order.notes,
        completedAt: order.completedAt
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Add review to service
router.post('/:id/reviews', authMiddleware, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 })
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

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const { rating, comment } = req.body;

    // Check if user has ordered this service
    const hasOrdered = service.orders.some(order => 
      order.user.toString() === req.user._id.toString() && order.status === 'completed'
    );

    if (!hasOrdered) {
      return res.status(400).json({
        success: false,
        message: 'You must complete an order before reviewing'
      });
    }

    // Check if user has already reviewed
    const existingReview = service.reviews.find(review => 
      review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    // Add review
    service.reviews.push({
      user: req.user._id,
      rating,
      comment,
      createdAt: new Date()
    });

    // Update average rating
    const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
    service.rating.average = totalRating / service.reviews.length;
    service.rating.count = service.reviews.length;

    await service.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      review: {
        rating,
        comment,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review'
    });
  }
});

// Get user's services
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'active', page = 1, limit = 20 } = req.query;

    const filter = { provider: userId };
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .populate('orders.user', 'username avatar')
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
    console.error('Get user services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user services'
    });
  }
});

// Delete service
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider or admin/moderator
    if (service.provider.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    // Check if service has active orders
    const activeOrders = service.orders.filter(order => 
      ['pending', 'in-progress'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service with active orders'
      });
    }

    service.status = 'inactive';
    await service.save();

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
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