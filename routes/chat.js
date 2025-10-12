const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat with AI assistant
router.post('/chat', authMiddleware, [
  body('message').notEmpty().trim().isLength({ max: 1000 }),
  body('conversationId').optional().isMongoId()
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

    const { message, conversationId } = req.body;
    const user = req.user;

    // Get conversation history if conversationId is provided
    let conversationHistory = [];
    if (conversationId) {
      conversationHistory = await getConversationHistory(conversationId);
    }

    // Create system prompt for RaZeit gaming platform
    const systemPrompt = `You are RaZeit AI Assistant, a helpful AI for the RaZeit Gaming Platform. You help users with:

1. Platform features: marketplace, services, gems, wheel of luck, Steam integration
2. Account management: profile, wallet, gems, statistics
3. Technical support: payment issues, Steam connection, item delivery
4. General gaming questions: CS:GO, Dota 2, TF2, Rust, etc.
5. Platform policies and guidelines

User Information:
- Username: ${user.username}
- Role: ${user.role}
- Gems: ${user.gems}
- Wallet Balance: ${user.wallet.balance} ${user.wallet.currency}

Always be helpful, friendly, and provide accurate information. If you don't know something specific about the platform, suggest contacting support. Keep responses concise but informative.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      user: user._id.toString() // For tracking purposes
    });

    const aiResponse = completion.choices[0].message.content;

    // Save conversation to database
    const conversation = await saveConversation(user._id, message, aiResponse, conversationId);

    res.json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact our support team for assistance.";
    
    res.json({
      success: true,
      response: fallbackResponse,
      conversationId: null,
      timestamp: new Date(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
});

// Get conversation history
router.get('/conversation/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await getConversationHistory(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
});

// Get user's chat history
router.get('/history', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const conversations = await getUserConversations(userId, { page, limit });

    res.json({
      success: true,
      conversations: conversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(conversations.length / parseInt(limit)),
        totalConversations: conversations.length,
        hasNext: parseInt(page) * parseInt(limit) < conversations.length,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history'
    });
  }
});

// Get quick responses for common questions
router.get('/quick-responses', authMiddleware, async (req, res) => {
  try {
    const quickResponses = [
      {
        category: 'Account',
        questions: [
          'How do I change my password?',
          'How do I update my profile?',
          'How do I connect my Steam account?',
          'How do I check my gem balance?'
        ]
      },
      {
        category: 'Marketplace',
        questions: [
          'How do I list an item for sale?',
          'How do I buy an item?',
          'What are the marketplace fees?',
          'How do I withdraw money?'
        ]
      },
      {
        category: 'Services',
        questions: [
          'How do I offer a service?',
          'How do I order a service?',
          'What types of services are available?',
          'How do I track my service orders?'
        ]
      },
      {
        category: 'Gems & Payments',
        questions: [
          'How do I buy gems?',
          'What payment methods are accepted?',
          'How do I use wheel tokens?',
          'How do I spin the wheel of luck?'
        ]
      },
      {
        category: 'Steam Integration',
        questions: [
          'How do I sync my Steam inventory?',
          'How does automatic item delivery work?',
          'What games are supported?',
          'How do I check delivery status?'
        ]
      }
    ];

    res.json({
      success: true,
      quickResponses: quickResponses
    });

  } catch (error) {
    console.error('Get quick responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quick responses'
    });
  }
});

// Rate AI response
router.post('/rate-response', authMiddleware, [
  body('conversationId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('feedback').optional().trim().isLength({ max: 500 })
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

    const { conversationId, rating, feedback } = req.body;
    const userId = req.user._id;

    // Save rating and feedback
    await saveResponseRating(conversationId, userId, rating, feedback);

    res.json({
      success: true,
      message: 'Response rated successfully'
    });

  } catch (error) {
    console.error('Rate response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate response'
    });
  }
});

// Get AI statistics (admin only)
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const stats = await getAIStatistics();

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get AI statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI statistics'
    });
  }
});

// Helper functions
async function getConversationHistory(conversationId) {
  try {
    // This would query a Conversation model
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Get conversation history error:', error);
    return [];
  }
}

async function saveConversation(userId, userMessage, aiResponse, conversationId) {
  try {
    // This would save to a Conversation model
    // For now, return mock data
    return {
      _id: `conv_${Date.now()}`,
      userId: userId,
      messages: [
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() }
      ],
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Save conversation error:', error);
    return null;
  }
}

async function getUserConversations(userId, filters) {
  try {
    // This would query a Conversation model
    // For now, return mock data
    return [
      {
        _id: 'conv_1',
        lastMessage: 'How do I buy gems?',
        lastResponse: 'You can buy gems using USD or Rial through our payment system...',
        createdAt: new Date(),
        messageCount: 4
      },
      {
        _id: 'conv_2',
        lastMessage: 'How do I list an item?',
        lastResponse: 'To list an item on our marketplace, go to the marketplace section...',
        createdAt: new Date(),
        messageCount: 2
      }
    ];
  } catch (error) {
    console.error('Get user conversations error:', error);
    return [];
  }
}

async function saveResponseRating(conversationId, userId, rating, feedback) {
  try {
    // This would save to a ResponseRating model
    console.log(`User ${userId} rated conversation ${conversationId} with ${rating} stars`);
    if (feedback) {
      console.log(`Feedback: ${feedback}`);
    }
  } catch (error) {
    console.error('Save response rating error:', error);
  }
}

async function getAIStatistics() {
  try {
    // This would query various models for AI statistics
    return {
      totalConversations: 1250,
      totalMessages: 5670,
      averageRating: 4.2,
      responseTime: '2.3s',
      topCategories: [
        { category: 'Account Management', count: 450 },
        { category: 'Marketplace', count: 380 },
        { category: 'Payment Issues', count: 290 },
        { category: 'Steam Integration', count: 200 },
        { category: 'General Gaming', count: 150 }
      ],
      satisfactionRate: 87.5
    };
  } catch (error) {
    console.error('Get AI statistics error:', error);
    return {};
  }
}

module.exports = router;