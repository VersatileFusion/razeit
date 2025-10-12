const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const MarketplaceItem = require('../models/MarketplaceItem');
const { authMiddleware } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Steam API configuration
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_API_BASE_URL = 'https://api.steampowered.com';

// Connect user's Steam account
router.post('/connect', authMiddleware, [
  body('steamId').notEmpty().trim(),
  body('steamUsername').notEmpty().trim()
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

    const { steamId, steamUsername } = req.body;

    // Verify Steam ID format
    if (!isValidSteamId(steamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Steam ID format'
      });
    }

    // Check if Steam ID is already connected to another account
    const existingUser = await User.findOne({
      'steam.steamId': steamId,
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This Steam account is already connected to another user'
      });
    }

    // Get Steam profile information
    const steamProfile = await getSteamProfile(steamId);
    if (!steamProfile) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve Steam profile information'
      });
    }

    // Update user's Steam information
    const user = await User.findById(req.user._id);
    user.steam = {
      steamId: steamId,
      steamUsername: steamUsername,
      isConnected: true,
      profileUrl: steamProfile.profileurl,
      avatar: steamProfile.avatar,
      lastUpdated: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Steam account connected successfully',
      steam: user.steam
    });

  } catch (error) {
    console.error('Connect Steam account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Steam account'
    });
  }
});

// Disconnect Steam account
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.steam.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'No Steam account connected'
      });
    }

    // Reset Steam information
    user.steam = {
      steamId: null,
      steamUsername: null,
      isConnected: false
    };

    await user.save();

    res.json({
      success: true,
      message: 'Steam account disconnected successfully'
    });

  } catch (error) {
    console.error('Disconnect Steam account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Steam account'
    });
  }
});

// Get Steam inventory
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.steam.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Steam account not connected'
      });
    }

    const { appId = 730 } = req.query; // Default to CS:GO (730)

    const inventory = await getSteamInventory(user.steam.steamId, appId);

    res.json({
      success: true,
      inventory: inventory
    });

  } catch (error) {
    console.error('Get Steam inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Steam inventory'
    });
  }
});

// Get Steam market prices
router.get('/market-prices', async (req, res) => {
  try {
    const { itemName, appId = 730 } = req.query;

    if (!itemName) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    const marketData = await getSteamMarketPrice(itemName, appId);

    res.json({
      success: true,
      marketData: marketData
    });

  } catch (error) {
    console.error('Get Steam market prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Steam market prices'
    });
  }
});

// Auto-deliver item to Steam account
router.post('/deliver-item', authMiddleware, [
  body('itemId').isMongoId(),
  body('recipientSteamId').notEmpty().trim()
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

    const { itemId, recipientSteamId } = req.body;

    // Get marketplace item
    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is the buyer
    if (item.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to deliver this item'
      });
    }

    // Check if item is sold
    if (item.status !== 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Item is not sold yet'
      });
    }

    // Verify recipient Steam ID
    if (!isValidSteamId(recipientSteamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient Steam ID'
      });
    }

    // Process Steam delivery
    const deliveryResult = await processSteamDelivery(item, recipientSteamId);

    if (!deliveryResult.success) {
      return res.status(400).json({
        success: false,
        message: deliveryResult.message
      });
    }

    // Update item status
    item.deliveryStatus = 'delivered';
    item.deliveredAt = new Date();
    item.recipientSteamId = recipientSteamId;
    await item.save();

    res.json({
      success: true,
      message: 'Item delivered successfully',
      delivery: {
        itemId: item._id,
        itemName: item.title,
        recipientSteamId: recipientSteamId,
        deliveryId: deliveryResult.deliveryId,
        deliveredAt: item.deliveredAt
      }
    });

  } catch (error) {
    console.error('Deliver item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deliver item'
    });
  }
});

// Get delivery status
router.get('/delivery-status/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is authorized to view delivery status
    if (item.buyer.toString() !== req.user._id.toString() && 
        item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view delivery status'
      });
    }

    res.json({
      success: true,
      deliveryStatus: {
        itemId: item._id,
        status: item.deliveryStatus || 'pending',
        deliveredAt: item.deliveredAt,
        recipientSteamId: item.recipientSteamId
      }
    });

  } catch (error) {
    console.error('Get delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery status'
    });
  }
});

// Sync Steam inventory with marketplace
router.post('/sync-inventory', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.steam.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Steam account not connected'
      });
    }

    const { appId = 730 } = req.body; // Default to CS:GO

    // Get Steam inventory
    const inventory = await getSteamInventory(user.steam.steamId, appId);
    
    // Sync items with marketplace
    const syncResult = await syncInventoryWithMarketplace(user._id, inventory, appId);

    res.json({
      success: true,
      message: 'Inventory synced successfully',
      syncResult: syncResult
    });

  } catch (error) {
    console.error('Sync inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync inventory'
    });
  }
});

// Helper functions
function isValidSteamId(steamId) {
  // Steam ID should be 17 digits
  return /^[0-9]{17}$/.test(steamId);
}

async function getSteamProfile(steamId) {
  try {
    const response = await axios.get(`${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/`, {
      params: {
        key: STEAM_API_KEY,
        steamids: steamId
      }
    });

    const players = response.data.response.players;
    if (players && players.length > 0) {
      return players[0];
    }
    return null;
  } catch (error) {
    console.error('Get Steam profile error:', error);
    return null;
  }
}

async function getSteamInventory(steamId, appId) {
  try {
    const response = await axios.get(`https://steamcommunity.com/inventory/${steamId}/${appId}/2`, {
      params: {
        l: 'english',
        count: 2000
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get Steam inventory error:', error);
    return null;
  }
}

async function getSteamMarketPrice(itemName, appId) {
  try {
    const response = await axios.get(`https://steamcommunity.com/market/priceoverview/`, {
      params: {
        currency: 1, // USD
        appid: appId,
        market_hash_name: itemName
      }
    });

    return response.data;
  } catch (error) {
    console.error('Get Steam market price error:', error);
    return null;
  }
}

async function processSteamDelivery(item, recipientSteamId) {
  try {
    // This would integrate with Steam trading or item transfer APIs
    // For now, we'll simulate the delivery process
    
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate delivery process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      deliveryId: deliveryId,
      message: 'Item delivered successfully'
    };
  } catch (error) {
    console.error('Process Steam delivery error:', error);
    return {
      success: false,
      message: 'Failed to process delivery'
    };
  }
}

async function syncInventoryWithMarketplace(userId, inventory, appId) {
  try {
    // This would sync Steam inventory items with marketplace listings
    // For now, return mock data
    
    return {
      itemsProcessed: inventory?.assets?.length || 0,
      newListings: 0,
      updatedListings: 0,
      errors: []
    };
  } catch (error) {
    console.error('Sync inventory with marketplace error:', error);
    return {
      itemsProcessed: 0,
      newListings: 0,
      updatedListings: 0,
      errors: ['Failed to sync inventory']
    };
  }
}

module.exports = router;