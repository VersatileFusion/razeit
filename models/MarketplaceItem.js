const mongoose = require('mongoose');

const marketplaceItemSchema = new mongoose.Schema({
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
    enum: ['csgo', 'dota2', 'tf2', 'rust', 'other']
  },
  game: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['weapon', 'skin', 'knife', 'glove', 'sticker', 'case', 'key', 'other']
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  condition: {
    type: String,
    enum: ['factory-new', 'minimal-wear', 'field-tested', 'well-worn', 'battle-scarred'],
    default: 'field-tested'
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  price: {
    gems: { type: Number, required: true, min: 0 },
    usd: { type: Number, required: true, min: 0 },
    rial: { type: Number, required: true, min: 0 }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled', 'pending'],
    default: 'active'
  },
  steamItemId: String,
  steamMarketUrl: String,
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  soldAt: Date,
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
}, {
  timestamps: true
});

// Index for better performance
marketplaceItemSchema.index({ category: 1, status: 1 });
marketplaceItemSchema.index({ seller: 1, status: 1 });
marketplaceItemSchema.index({ price: 1 });
marketplaceItemSchema.index({ createdAt: -1 });
marketplaceItemSchema.index({ isFeatured: 1, featuredUntil: 1 });
marketplaceItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);