const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Create payment intent for USD payments
router.post('/create-payment-intent', authMiddleware, [
  body('amount').isNumeric().isFloat({ min: 0.01 }),
  body('currency').isIn(['usd']),
  body('description').optional().trim()
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

    const { amount, currency, description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      description: description || 'RaZeit Gaming Platform Payment',
      metadata: {
        userId: req.user._id.toString(),
        username: req.user.username
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm payment and process
router.post('/confirm-payment', authMiddleware, [
  body('paymentIntentId').notEmpty().trim(),
  body('type').isIn(['gems', 'wheel-tokens', 'marketplace', 'services']),
  body('itemId').optional().isMongoId(),
  body('quantity').optional().isInt({ min: 1 })
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

    const { paymentIntentId, type, itemId, quantity = 1 } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Verify the payment belongs to the user
    if (paymentIntent.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Payment does not belong to this user'
      });
    }

    const amount = paymentIntent.amount / 100; // Convert from cents
    const user = await User.findById(req.user._id);

    // Process payment based on type
    let result = {};
    
    switch (type) {
      case 'gems':
        result = await processGemPurchase(user, amount, quantity);
        break;
      case 'wheel-tokens':
        result = await processWheelTokenPurchase(user, amount, quantity);
        break;
      case 'marketplace':
        result = await processMarketplacePurchase(user, amount, itemId);
        break;
      case 'services':
        result = await processServicePurchase(user, amount, itemId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment type'
        });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user statistics
    user.statistics.totalSpent += amount;
    await user.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      transaction: {
        id: paymentIntent.id,
        amount: amount,
        currency: paymentIntent.currency,
        type: type,
        ...result.data
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create Rial payment (Iranian Rial)
router.post('/create-rial-payment', authMiddleware, [
  body('amount').isNumeric().isFloat({ min: 1000 }),
  body('description').optional().trim(),
  body('type').isIn(['gems', 'wheel-tokens', 'marketplace', 'services']),
  body('itemId').optional().isMongoId(),
  body('quantity').optional().isInt({ min: 1 })
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

    const { amount, description, type, itemId, quantity = 1 } = req.body;

    // For Rial payments, we'll use a different approach since Stripe doesn't support IRR
    // This would integrate with Iranian payment gateways like ZarinPal, Pay.ir, etc.
    
    const paymentData = {
      amount: amount,
      currency: 'IRR',
      description: description || 'RaZeit Gaming Platform Payment',
      userId: req.user._id.toString(),
      username: req.user.username,
      type: type,
      itemId: itemId,
      quantity: quantity,
      createdAt: new Date()
    };

    // Generate payment reference
    const paymentRef = `rial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real implementation, this would create a payment with Iranian gateway
    // For now, we'll simulate the process
    const paymentResult = await createRialPayment(paymentData, paymentRef);

    res.json({
      success: true,
      paymentRef: paymentRef,
      paymentUrl: paymentResult.paymentUrl,
      message: 'Rial payment created successfully'
    });

  } catch (error) {
    console.error('Create rial payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rial payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify Rial payment
router.post('/verify-rial-payment', authMiddleware, [
  body('paymentRef').notEmpty().trim(),
  body('transactionId').notEmpty().trim()
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

    const { paymentRef, transactionId } = req.body;

    // Verify payment with Iranian gateway
    const verificationResult = await verifyRialPayment(paymentRef, transactionId);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const { amount, type, itemId, quantity } = verificationResult.paymentData;
    const user = await User.findById(req.user._id);

    // Process payment based on type
    let result = {};
    
    switch (type) {
      case 'gems':
        result = await processGemPurchase(user, amount, quantity);
        break;
      case 'wheel-tokens':
        result = await processWheelTokenPurchase(user, amount, quantity);
        break;
      case 'marketplace':
        result = await processMarketplacePurchase(user, amount, itemId);
        break;
      case 'services':
        result = await processServicePurchase(user, amount, itemId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment type'
        });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update user statistics
    user.statistics.totalSpent += amount;
    await user.save();

    res.json({
      success: true,
      message: 'Rial payment verified and processed successfully',
      transaction: {
        id: transactionId,
        amount: amount,
        currency: 'IRR',
        type: type,
        ...result.data
      }
    });

  } catch (error) {
    console.error('Verify rial payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify rial payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get payment history
router.get('/history', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['gems', 'wheel-tokens', 'marketplace', 'services']),
  query('currency').optional().isIn(['usd', 'irr'])
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

    const { page = 1, limit = 20, type, currency } = req.query;

    // This would query a PaymentHistory model
    // For now, we'll return mock data
    const payments = await getPaymentHistory(req.user._id, { page, limit, type, currency });

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(payments.length / parseInt(limit)),
        totalPayments: payments.length,
        hasNext: parseInt(page) * parseInt(limit) < payments.length,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// Helper functions
async function processGemPurchase(user, amount, quantity) {
  try {
    // Calculate gems based on exchange rate (example: $1 = 100 gems)
    const exchangeRate = 100; // This should come from Gem model
    const gemsToAdd = Math.floor(amount * exchangeRate * quantity);
    
    user.gems += gemsToAdd;
    
    return {
      success: true,
      data: {
        gemsAdded: gemsToAdd,
        newBalance: user.gems
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process gem purchase'
    };
  }
}

async function processWheelTokenPurchase(user, amount, quantity) {
  try {
    // Calculate wheel tokens based on price
    const tokenPrice = 1; // This should come from WheelToken model
    const tokensToAdd = Math.floor(amount / tokenPrice) * quantity;
    
    // Add tokens to user account (this would update a UserWheelTokens model)
    await addWheelTokens(user._id, tokensToAdd);
    
    return {
      success: true,
      data: {
        tokensAdded: tokensToAdd,
        quantity: quantity
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process wheel token purchase'
    };
  }
}

async function processMarketplacePurchase(user, amount, itemId) {
  try {
    // This would handle marketplace item purchase
    // Implementation would be similar to the marketplace route
    
    return {
      success: true,
      data: {
        itemId: itemId,
        amount: amount
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process marketplace purchase'
    };
  }
}

async function processServicePurchase(user, amount, itemId) {
  try {
    // This would handle service purchase
    // Implementation would be similar to the services route
    
    return {
      success: true,
      data: {
        serviceId: itemId,
        amount: amount
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process service purchase'
    };
  }
}

async function createRialPayment(paymentData, paymentRef) {
  // This would integrate with Iranian payment gateways
  // For now, return mock data
  return {
    success: true,
    paymentUrl: `https://gateway.example.com/pay/${paymentRef}`
  };
}

async function verifyRialPayment(paymentRef, transactionId) {
  // This would verify payment with Iranian gateway
  // For now, return mock verification
  return {
    success: true,
    paymentData: {
      amount: 100000, // Example amount in IRR
      type: 'gems',
      quantity: 1
    }
  };
}

async function getPaymentHistory(userId, filters) {
  // This would query a PaymentHistory model
  // For now, return mock data
  return [
    {
      id: 'pay_1',
      amount: 10.00,
      currency: 'USD',
      type: 'gems',
      status: 'completed',
      createdAt: new Date()
    },
    {
      id: 'pay_2',
      amount: 500000,
      currency: 'IRR',
      type: 'wheel-tokens',
      status: 'completed',
      createdAt: new Date()
    }
  ];
}

async function addWheelTokens(userId, amount) {
  // This would update a UserWheelTokens model
  console.log(`Added ${amount} wheel tokens to user ${userId}`);
}

module.exports = router;