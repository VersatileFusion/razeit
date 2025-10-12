const mongoose = require('mongoose');

const gemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: null
  },
  exchangeRate: {
    usd: { type: Number, required: true, min: 0 },
    rial: { type: Number, required: true, min: 0 }
  },
  minPurchase: {
    type: Number,
    required: true,
    min: 1
  },
  maxPurchase: {
    type: Number,
    required: true,
    min: 1
  },
  bonusRates: [{
    minAmount: { type: Number, required: true },
    bonusPercentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance (symbol already has unique index)
gemSchema.index({ isActive: 1 });

module.exports = mongoose.model('Gem', gemSchema);