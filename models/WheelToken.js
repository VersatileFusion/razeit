const mongoose = require('mongoose');

const wheelTokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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
  price: {
    gems: { type: Number, required: true, min: 0 },
    usd: { type: Number, required: true, min: 0 },
    rial: { type: Number, required: true, min: 0 }
  },
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

// Index for better performance
wheelTokenSchema.index({ isActive: 1 });
wheelTokenSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WheelToken', wheelTokenSchema);