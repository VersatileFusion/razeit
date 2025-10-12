const mongoose = require('mongoose');

const forumCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#007bff'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canView: {
      type: String,
      enum: ['all', 'registered', 'premium', 'admin'],
      default: 'all'
    },
    canPost: {
      type: String,
      enum: ['all', 'registered', 'premium', 'admin'],
      default: 'registered'
    },
    canModerate: {
      type: String,
      enum: ['moderator', 'admin'],
      default: 'moderator'
    }
  },
  stats: {
    topicsCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    lastActivity: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumCategory', forumCategorySchema);