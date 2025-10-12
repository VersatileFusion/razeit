const mongoose = require('mongoose');

const wheelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  costPerSpin: {
    gems: { type: Number, required: true, min: 1 },
    tokens: { type: Number, required: true, min: 1 }
  },
  prizes: [{
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['gems', 'tokens', 'item', 'discount', 'cash'],
      required: true
    },
    value: { type: Number, required: true },
    probability: { type: Number, required: true, min: 0, max: 100 },
    icon: String,
    color: String,
    isActive: { type: Boolean, default: true }
  }],
  dailyLimit: {
    type: Number,
    default: 10,
    min: 1
  },
  cooldownMinutes: {
    type: Number,
    default: 60,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
wheelSchema.index({ isActive: 1 });
wheelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Wheel', wheelSchema);