const express = require('express');
const { body, validationResult } = require('express-validator');
const Wheel = require('../models/Wheel');
const WheelToken = require('../models/WheelToken');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get active wheels (public)
router.get('/wheels', async (req, res) => {
  try {
    const wheels = await Wheel.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      wheels
    });
  } catch (error) {
    console.error('Get wheels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wheels'
    });
  }
});

// Get wheel by ID (public)
router.get('/wheels/:id', async (req, res) => {
  try {
    const wheel = await Wheel.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!wheel || !wheel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Wheel not found'
      });
    }

    res.json({
      success: true,
      wheel
    });
  } catch (error) {
    console.error('Get wheel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wheel'
    });
  }
});

// Create wheel (admin only)
router.post('/wheels', authMiddleware, adminMiddleware, [
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('costPerSpin.gems').isInt({ min: 1 }),
  body('costPerSpin.tokens').isInt({ min: 1 }),
  body('prizes').isArray({ min: 1 }),
  body('dailyLimit').isInt({ min: 1 }),
  body('cooldownMinutes').isInt({ min: 0 })
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

    const { name, description, costPerSpin, prizes, dailyLimit, cooldownMinutes } = req.body;

    // Validate prizes
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    if (Math.abs(totalProbability - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total probability must equal 100%'
      });
    }

    const wheel = new Wheel({
      name,
      description,
      costPerSpin,
      prizes,
      dailyLimit,
      cooldownMinutes,
      createdBy: req.user._id
    });

    await wheel.save();

    res.status(201).json({
      success: true,
      message: 'Wheel created successfully',
      wheel
    });

  } catch (error) {
    console.error('Create wheel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wheel'
    });
  }
});

// Update wheel (admin only)
router.put('/wheels/:id', authMiddleware, adminMiddleware, [
  body('name').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('costPerSpin.gems').optional().isInt({ min: 1 }),
  body('costPerSpin.tokens').optional().isInt({ min: 1 }),
  body('prizes').optional().isArray({ min: 1 }),
  body('dailyLimit').optional().isInt({ min: 1 }),
  body('cooldownMinutes').optional().isInt({ min: 0 })
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

    const wheel = await Wheel.findById(req.params.id);
    if (!wheel) {
      return res.status(404).json({
        success: false,
        message: 'Wheel not found'
      });
    }

    const { name, description, costPerSpin, prizes, dailyLimit, cooldownMinutes, isActive } = req.body;

    // Validate prizes if provided
    if (prizes) {
      const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
      if (Math.abs(totalProbability - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Total probability must equal 100%'
        });
      }
    }

    // Update fields
    if (name) wheel.name = name;
    if (description) wheel.description = description;
    if (costPerSpin) wheel.costPerSpin = costPerSpin;
    if (prizes) wheel.prizes = prizes;
    if (dailyLimit) wheel.dailyLimit = dailyLimit;
    if (cooldownMinutes !== undefined) wheel.cooldownMinutes = cooldownMinutes;
    if (isActive !== undefined) wheel.isActive = isActive;

    await wheel.save();

    res.json({
      success: true,
      message: 'Wheel updated successfully',
      wheel
    });

  } catch (error) {
    console.error('Update wheel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wheel'
    });
  }
});

// Spin wheel
router.post('/spin/:wheelId', authMiddleware, [
  body('paymentMethod').isIn(['gems', 'tokens'])
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

    const { wheelId } = req.params;
    const { paymentMethod } = req.body;

    const wheel = await Wheel.findById(wheelId);
    if (!wheel || !wheel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Wheel not found or inactive'
      });
    }

    const user = await User.findById(req.user._id);

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const spinsToday = await getSpinsToday(user._id, wheelId, today);
    if (spinsToday >= wheel.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Daily spin limit reached'
      });
    }

    // Check cooldown
    const lastSpin = await getLastSpin(user._id, wheelId);
    if (lastSpin) {
      const cooldownMs = wheel.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastSpin.createdAt.getTime() < cooldownMs) {
        const remainingTime = Math.ceil((cooldownMs - (Date.now() - lastSpin.createdAt.getTime())) / 1000 / 60);
        return res.status(400).json({
          success: false,
          message: `Please wait ${remainingTime} minutes before spinning again`
        });
      }
    }

    // Check payment
    const cost = wheel.costPerSpin[paymentMethod];
    if (paymentMethod === 'gems') {
      if (user.gems < cost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient gems'
        });
      }
    } else if (paymentMethod === 'tokens') {
      // Check if user has wheel tokens
      const userTokens = await getUserWheelTokens(user._id);
      if (userTokens < cost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wheel tokens'
        });
      }
    }

    // Deduct payment
    if (paymentMethod === 'gems') {
      user.gems -= cost;
    } else {
      await deductWheelTokens(user._id, cost);
    }

    // Spin the wheel
    const prize = spinWheel(wheel.prizes);
    
    // Award prize
    await awardPrize(user._id, prize);

    // Record the spin
    await recordSpin(user._id, wheelId, prize, cost, paymentMethod);

    await user.save();

    res.json({
      success: true,
      message: 'Wheel spun successfully',
      prize: {
        name: prize.name,
        description: prize.description,
        type: prize.type,
        value: prize.value,
        icon: prize.icon,
        color: prize.color
      },
      cost: cost,
      paymentMethod: paymentMethod
    });

  } catch (error) {
    console.error('Spin wheel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to spin wheel'
    });
  }
});

// Get wheel tokens (public)
router.get('/tokens', async (req, res) => {
  try {
    const tokens = await WheelToken.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error('Get wheel tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wheel tokens'
    });
  }
});

// Create wheel token (admin only)
router.post('/tokens', authMiddleware, adminMiddleware, [
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('price.gems').isNumeric().isFloat({ min: 0 }),
  body('price.usd').isNumeric().isFloat({ min: 0 }),
  body('price.rial').isNumeric().isFloat({ min: 0 })
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

    const { name, description, icon, price } = req.body;

    const token = new WheelToken({
      name,
      description,
      icon,
      price,
      createdBy: req.user._id
    });

    await token.save();

    res.status(201).json({
      success: true,
      message: 'Wheel token created successfully',
      token
    });

  } catch (error) {
    console.error('Create wheel token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wheel token'
    });
  }
});

// Purchase wheel tokens
router.post('/tokens/purchase', authMiddleware, [
  body('tokenId').isMongoId(),
  body('quantity').isInt({ min: 1 }),
  body('paymentMethod').isIn(['gems', 'usd', 'rial'])
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

    const { tokenId, quantity, paymentMethod } = req.body;

    const token = await WheelToken.findById(tokenId);
    if (!token || !token.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Wheel token not found'
      });
    }

    const totalCost = token.price[paymentMethod] * quantity;
    const user = await User.findById(req.user._id);

    // Check payment
    if (paymentMethod === 'gems') {
      if (user.gems < totalCost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient gems'
        });
      }
      user.gems -= totalCost;
    } else {
      // Process external payment (USD/Rial)
      const paymentResult = await processExternalPayment(paymentMethod, totalCost, req.body.paymentDetails);
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        });
      }
    }

    // Add tokens to user account
    await addWheelTokens(user._id, quantity);

    await user.save();

    res.json({
      success: true,
      message: 'Wheel tokens purchased successfully',
      quantity,
      totalCost,
      paymentMethod
    });

  } catch (error) {
    console.error('Purchase wheel tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase wheel tokens'
    });
  }
});

// Helper functions
function spinWheel(prizes) {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }

  // Fallback to first prize if something goes wrong
  return prizes[0];
}

async function awardPrize(userId, prize) {
  const user = await User.findById(userId);
  
  switch (prize.type) {
    case 'gems':
      user.gems += prize.value;
      break;
    case 'tokens':
      await addWheelTokens(userId, prize.value);
      break;
    case 'cash':
      user.wallet.balance += prize.value;
      break;
    case 'discount':
      // Implement discount system
      break;
    case 'item':
      // Implement item reward system
      break;
  }
  
  await user.save();
}

async function recordSpin(userId, wheelId, prize, cost, paymentMethod) {
  // This would be stored in a separate SpinHistory model
  // For now, we'll just log it
  console.log(`User ${userId} spun wheel ${wheelId} and won ${prize.name}`);
}

async function getSpinsToday(userId, wheelId, today) {
  // This would query a SpinHistory model
  // For now, return 0
  return 0;
}

async function getLastSpin(userId, wheelId) {
  // This would query a SpinHistory model
  // For now, return null
  return null;
}

async function getUserWheelTokens(userId) {
  // This would query a UserWheelTokens model
  // For now, return 0
  return 0;
}

async function deductWheelTokens(userId, amount) {
  // This would update a UserWheelTokens model
  // For now, just log it
  console.log(`Deducted ${amount} wheel tokens from user ${userId}`);
}

async function addWheelTokens(userId, amount) {
  // This would update a UserWheelTokens model
  // For now, just log it
  console.log(`Added ${amount} wheel tokens to user ${userId}`);
}

async function processExternalPayment(method, amount, details) {
  // This would integrate with payment gateway
  return {
    success: true,
    transactionId: `txn_${Date.now()}`
  };
}

module.exports = router;