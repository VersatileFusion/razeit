const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isVerified: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false }
  },
  verificationTokens: {
    email: String,
    phone: String,
    passwordReset: String
  },
  gems: {
    type: Number,
    default: 0,
    min: 0
  },
  wallet: {
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' }
  },
  steam: {
    steamId: String,
    steamUsername: String,
    isConnected: { type: Boolean, default: false }
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  statistics: {
    totalSpent: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    itemsPurchased: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 },
    lastLogin: Date,
    loginCount: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    role: this.role,
    gems: this.gems,
    steam: this.steam,
    statistics: {
      itemsPurchased: this.statistics.itemsPurchased,
      itemsSold: this.statistics.itemsSold,
      lastSeen: this.lastSeen
    },
    createdAt: this.createdAt
  };
};

// Index for better performance (email, username, phone already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('User', userSchema);