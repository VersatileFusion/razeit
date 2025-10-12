const express = require('express');
const { body, validationResult, query } = require('express-validator');
const ForumCategory = require('../models/ForumCategory');
const ForumTopic = require('../models/ForumTopic');
const User = require('../models/User');
const { authMiddleware, moderatorMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all forum categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await ForumCategory.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .populate('stats.lastActivity');

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get forum categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get forum categories'
    });
  }
});

// Get category by ID with topics
router.get('/categories/:id', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['createdAt', 'lastPost', 'views', 'postsCount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isIn(['active', 'locked', 'pinned', 'archived'])
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
    const {
      page = 1,
      limit = 20,
      sortBy = 'lastPost',
      sortOrder = 'desc',
      status = 'active'
    } = req.query;

    const category = await ForumCategory.findById(id);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build filter
    const filter = { category: id };
    if (status !== 'all') {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    if (sortBy !== 'isPinned') {
      sort.isPinned = -1; // Always show pinned topics first
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const topics = await ForumTopic.find(filter)
      .populate('author', 'username avatar')
      .populate('lastPost.author', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTopics = await ForumTopic.countDocuments(filter);

    res.json({
      success: true,
      category,
      topics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTopics / parseInt(limit)),
        totalTopics,
        hasNext: skip + topics.length < totalTopics,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get category topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category topics'
    });
  }
});

// Create new topic
router.post('/topics', authMiddleware, [
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('content').notEmpty().trim().isLength({ min: 10, max: 10000 }),
  body('categoryId').isMongoId(),
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

    const { title, content, categoryId, tags = [] } = req.body;

    const category = await ForumCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check permissions
    if (category.permissions.canPost === 'premium' && req.user.role !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium membership required to post in this category'
      });
    }

    const topic = new ForumTopic({
      title,
      content,
      category: categoryId,
      author: req.user._id,
      tags
    });

    await topic.save();

    // Update category stats
    category.stats.topicsCount += 1;
    category.stats.lastActivity = new Date();
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic
    });

  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create topic'
    });
  }
});

// Get topic by ID
router.get('/topics/:id', async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id)
      .populate('author', 'username avatar role')
      .populate('posts.author', 'username avatar role')
      .populate('lastPost.author', 'username avatar')
      .populate('category', 'name permissions');

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Increment view count
    topic.views += 1;
    await topic.save();

    res.json({
      success: true,
      topic
    });

  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get topic'
    });
  }
});

// Add post to topic
router.post('/topics/:id/posts', authMiddleware, [
  body('content').notEmpty().trim().isLength({ min: 5, max: 5000 })
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

    const { content } = req.body;
    const topicId = req.params.id;

    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    if (topic.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Topic is locked'
      });
    }

    // Add post to topic
    const post = {
      author: req.user._id,
      content,
      createdAt: new Date()
    };

    topic.posts.push(post);
    topic.stats.postsCount += 1;
    topic.lastPost = {
      author: req.user._id,
      createdAt: new Date()
    };

    await topic.save();

    // Update category stats
    const category = await ForumCategory.findById(topic.category);
    category.stats.postsCount += 1;
    category.stats.lastActivity = new Date();
    await category.save();

    res.json({
      success: true,
      message: 'Post added successfully',
      post: {
        ...post,
        author: req.user
      }
    });

  } catch (error) {
    console.error('Add post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add post'
    });
  }
});

// Like/Unlike topic
router.post('/topics/:id/like', authMiddleware, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const existingLike = topic.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      topic.likes = topic.likes.filter(like => 
        like.user.toString() !== req.user._id.toString()
      );
      topic.stats.likesCount -= 1;
    } else {
      // Like
      topic.likes.push({
        user: req.user._id,
        createdAt: new Date()
      });
      topic.stats.likesCount += 1;
    }

    await topic.save();

    res.json({
      success: true,
      message: existingLike ? 'Topic unliked' : 'Topic liked',
      likesCount: topic.stats.likesCount,
      isLiked: !existingLike
    });

  } catch (error) {
    console.error('Like topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike topic'
    });
  }
});

// Search topics
router.get('/search', [
  query('q').notEmpty().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isMongoId()
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

    const { q, page = 1, limit = 20, category } = req.query;

    const filter = {
      $text: { $search: q },
      status: 'active'
    };

    if (category) {
      filter.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const topics = await ForumTopic.find(filter)
      .populate('author', 'username avatar')
      .populate('category', 'name')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTopics = await ForumTopic.countDocuments(filter);

    res.json({
      success: true,
      topics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTopics / parseInt(limit)),
        totalTopics,
        hasNext: skip + topics.length < totalTopics,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Search topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search topics'
    });
  }
});

// Get recent topics
router.get('/recent', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topics = await ForumTopic.find({ status: 'active' })
      .populate('author', 'username avatar')
      .populate('category', 'name')
      .populate('lastPost.author', 'username avatar')
      .sort({ lastPost: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      topics
    });

  } catch (error) {
    console.error('Get recent topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent topics'
    });
  }
});

// Update topic status (moderator/admin only)
router.put('/topics/:id/status', authMiddleware, moderatorMiddleware, [
  body('status').isIn(['active', 'locked', 'pinned', 'archived']),
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

    const topic = await ForumTopic.findById(id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    topic.status = status;
    topic.isLocked = status === 'locked';
    topic.isPinned = status === 'pinned';

    await topic.save();

    res.json({
      success: true,
      message: 'Topic status updated successfully',
      topic: {
        id: topic._id,
        title: topic.title,
        status: topic.status,
        isLocked: topic.isLocked,
        isPinned: topic.isPinned
      },
      reason
    });

  } catch (error) {
    console.error('Update topic status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update topic status'
    });
  }
});

// Create category (admin only)
router.post('/categories', authMiddleware, moderatorMiddleware, [
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('permissions.canView').isIn(['all', 'registered', 'premium', 'admin']),
  body('permissions.canPost').isIn(['all', 'registered', 'premium', 'admin']),
  body('permissions.canModerate').isIn(['moderator', 'admin'])
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

    const { name, description, icon, color, order, permissions } = req.body;

    const category = new ForumCategory({
      name,
      description,
      icon,
      color,
      order,
      permissions
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

module.exports = router;