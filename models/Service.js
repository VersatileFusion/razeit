const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['boosting', 'coaching', 'account', 'items', 'other']
  },
  game: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    gems: { type: Number, required: true, min: 0 },
    usd: { type: Number, required: true, min: 0 },
    rial: { type: Number, required: true, min: 0 }
  },
  duration: {
    type: String,
    required: true,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'one-time']
  },
  estimatedTime: {
    type: String,
    required: true
  },
  requirements: [String],
  deliverables: [String],
  images: [{
    url: String,
    alt: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  orders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  tags: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date
}, {
  timestamps: true
});

// Index for better performance
serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ provider: 1, status: 1 });
serviceSchema.index({ game: 1, category: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);