const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumCategory',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'locked', 'pinned', 'archived'],
    default: 'active'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  posts: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true, maxlength: 5000 },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  lastPost: {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  },
  stats: {
    postsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better performance
forumTopicSchema.index({ category: 1, createdAt: -1 });
forumTopicSchema.index({ author: 1, createdAt: -1 });
forumTopicSchema.index({ status: 1, isPinned: -1, createdAt: -1 });
forumTopicSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('ForumTopic', forumTopicSchema);