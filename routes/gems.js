const express = require('express');
const { body, validationResult } = require('express-validator');
const Gem = require('../models/Gem');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all gems (public)
router.get('/', async (req, res) => {
  try {
    const gems = await Gem.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      gems
    });
  } catch (error) {
    console.error('Get gems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gems'
    });
  }
});

// Get gem by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem || !gem.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Gem not found'
      });
    }

    res.json({
      success: true,
      gem
    });
  } catch (error) {
    console.error('Get gem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gem'
    });
  }
});

// Create gem (admin only)
router.post('/', authMiddleware, adminMiddleware, [
  body('name').notEmpty().trim(),
  body('symbol').notEmpty().trim().isLength({ min: 2, max: 5 }),
  body('description').notEmpty().trim(),
  body('exchangeRate.usd').isNumeric().isFloat({ min: 0 }),
  body('exchangeRate.rial').isNumeric().isFloat({ min: 0 }),
  body('minPurchase').isInt({ min: 1 }),
  body('maxPurchase').isInt({ min: 1 })
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

    const { name, symbol, description, icon, exchangeRate, minPurchase, maxPurchase, bonusRates } = req.body;

    // Check if gem already exists
    const existingGem = await Gem.findOne({
      $or: [{ name }, { symbol: symbol.toUpperCase() }]
    });

    if (existingGem) {
      return res.status(400).json({
        success: false,
        message: 'Gem with this name or symbol already exists'
      });
    }

    const gem = new Gem({
      name,
      symbol: symbol.toUpperCase(),
      description,
      icon,
      exchangeRate,
      minPurchase,
      maxPurchase,
      bonusRates: bonusRates || [],
      createdBy: req.user._id
    });

    await gem.save();

    res.status(201).json({
      success: true,
      message: 'Gem created successfully',
      gem
    });

  } catch (error) {
    console.error('Create gem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gem'
    });
  }
});

// Update gem (admin only)
router.put('/:id', authMiddleware, adminMiddleware, [
  body('name').optional().notEmpty().trim(),
  body('symbol').optional().notEmpty().trim().isLength({ min: 2, max: 5 }),
  body('description').optional().notEmpty().trim(),
  body('exchangeRate.usd').optional().isNumeric().isFloat({ min: 0 }),
  body('exchangeRate.rial').optional().isNumeric().isFloat({ min: 0 }),
  body('minPurchase').optional().isInt({ min: 1 }),
  body('maxPurchase').optional().isInt({ min: 1 })
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

    const gem = await Gem.findById(req.params.id);
    if (!gem) {
      return res.status(404).json({
        success: false,
        message: 'Gem not found'
      });
    }

    const { name, symbol, description, icon, exchangeRate, minPurchase, maxPurchase, bonusRates, isActive } = req.body;

    // Check for conflicts if updating name or symbol
    if (name || symbol) {
      const existingGem = await Gem.findOne({
        _id: { $ne: gem._id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(symbol ? [{ symbol: symbol.toUpperCase() }] : [])
        ]
      });

      if (existingGem) {
        return res.status(400).json({
          success: false,
          message: 'Gem with this name or symbol already exists'
        });
      }
    }

    // Update fields
    if (name) gem.name = name;
    if (symbol) gem.symbol = symbol.toUpperCase();
    if (description) gem.description = description;
    if (icon !== undefined) gem.icon = icon;
    if (exchangeRate) gem.exchangeRate = exchangeRate;
    if (minPurchase) gem.minPurchase = minPurchase;
    if (maxPurchase) gem.maxPurchase = maxPurchase;
    if (bonusRates) gem.bonusRates = bonusRates;
    if (isActive !== undefined) gem.isActive = isActive;

    await gem.save();

    res.json({
      success: true,
      message: 'Gem updated successfully',
      gem
    });

  } catch (error) {
    console.error('Update gem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gem'
    });
  }
});

// Delete gem (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) {
      return res.status(404).json({
        success: false,
        message: 'Gem not found'
      });
    }

    // Soft delete by setting isActive to false
    gem.isActive = false;
    await gem.save();

    res.json({
      success: true,
      message: 'Gem deactivated successfully'
    });

  } catch (error) {
    console.error('Delete gem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gem'
    });
  }
});

// Purchase gems
router.post('/purchase', authMiddleware, [
  body('gemId').isMongoId(),
  body('amount').isInt({ min: 1 }),
  body('paymentMethod').isIn(['usd', 'rial']),
  body('paymentDetails').isObject()
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

    const { gemId, amount, paymentMethod, paymentDetails } = req.body;

    const gem = await Gem.findById(gemId);
    if (!gem || !gem.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Gem not found or inactive'
      });
    }

    // Validate amount
    if (amount < gem.minPurchase || amount > gem.maxPurchase) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between ${gem.minPurchase} and ${gem.maxPurchase}`
      });
    }

    // Calculate cost
    const exchangeRate = gem.exchangeRate[paymentMethod];
    const baseCost = amount * exchangeRate;

    // Calculate bonus
    let bonusAmount = 0;
    for (const bonus of gem.bonusRates) {
      if (amount >= bonus.minAmount) {
        bonusAmount = Math.floor(amount * bonus.bonusPercentage / 100);
      }
    }

    const totalGems = amount + bonusAmount;
    const totalCost = baseCost;

    // Here you would integrate with payment gateway (Stripe, etc.)
    // For now, we'll simulate a successful payment
    const paymentResult = await processPayment(paymentMethod, totalCost, paymentDetails);

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: paymentResult.error
      });
    }

    // Add gems to user account
    const user = await User.findById(req.user._id);
    user.gems += totalGems;
    user.statistics.totalSpent += totalCost;
    await user.save();

    res.json({
      success: true,
      message: 'Gems purchased successfully',
      gemsPurchased: amount,
      bonusGems: bonusAmount,
      totalGems: totalGems,
      totalCost: totalCost,
      paymentMethod: paymentMethod,
      transactionId: paymentResult.transactionId
    });

  } catch (error) {
    console.error('Purchase gems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase gems'
    });
  }
});

// Get user's gem balance
router.get('/balance/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('gems wallet');
    
    res.json({
      success: true,
      gems: user.gems,
      wallet: user.wallet
    });

  } catch (error) {
    console.error('Get gem balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gem balance'
    });
  }
});

// Simulate payment processing (replace with actual payment gateway integration)
async function processPayment(method, amount, details) {
  // This is a placeholder - integrate with Stripe, PayPal, or other payment gateway
  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

module.exports = router;