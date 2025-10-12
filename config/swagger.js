const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RaZeit Gaming Platform API',
      version: '1.0.0',
      description: 'Comprehensive gaming platform backend with marketplace, services, gem currency, wheel of luck, Steam integration, AI chatbot, and community forums.',
      contact: {
        name: 'RaZeit Team',
        email: 'support@razeit.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.razeit.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            username: { type: 'string', example: 'gamer123' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            avatar: { type: 'string', example: '/uploads/avatars/avatar-123.jpg' },
            role: { type: 'string', enum: ['user', 'admin', 'moderator'], example: 'user' },
            gems: { type: 'number', example: 1000 },
            wallet: {
              type: 'object',
              properties: {
                balance: { type: 'number', example: 50.00 },
                currency: { type: 'string', example: 'USD' }
              }
            },
            steam: {
              type: 'object',
              properties: {
                steamId: { type: 'string', example: '76561198000000000' },
                steamUsername: { type: 'string', example: 'SteamUser' },
                isConnected: { type: 'boolean', example: true }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        MarketplaceItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'AK-47 Redline' },
            description: { type: 'string', example: 'Field-Tested AK-47 Redline' },
            category: { type: 'string', enum: ['csgo', 'dota2', 'tf2', 'rust', 'other'], example: 'csgo' },
            game: { type: 'string', example: 'Counter-Strike: Global Offensive' },
            itemType: { type: 'string', enum: ['weapon', 'skin', 'knife', 'glove', 'sticker', 'case', 'key', 'other'], example: 'weapon' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'], example: 'rare' },
            condition: { type: 'string', enum: ['factory-new', 'minimal-wear', 'field-tested', 'well-worn', 'battle-scarred'], example: 'field-tested' },
            price: {
              type: 'object',
              properties: {
                gems: { type: 'number', example: 500 },
                usd: { type: 'number', example: 5.00 },
                rial: { type: 'number', example: 250000 }
              }
            },
            seller: { $ref: '#/components/schemas/User' },
            status: { type: 'string', enum: ['active', 'sold', 'cancelled', 'pending'], example: 'active' },
            views: { type: 'number', example: 25 },
            likes: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'CS:GO Boosting Service' },
            description: { type: 'string', example: 'Professional CS:GO rank boosting' },
            category: { type: 'string', enum: ['boosting', 'coaching', 'account', 'items', 'other'], example: 'boosting' },
            game: { type: 'string', example: 'Counter-Strike: Global Offensive' },
            price: {
              type: 'object',
              properties: {
                gems: { type: 'number', example: 1000 },
                usd: { type: 'number', example: 10.00 },
                rial: { type: 'number', example: 500000 }
              }
            },
            duration: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly', 'one-time'], example: 'one-time' },
            estimatedTime: { type: 'string', example: '2-3 days' },
            provider: { $ref: '#/components/schemas/User' },
            rating: {
              type: 'object',
              properties: {
                average: { type: 'number', example: 4.5 },
                count: { type: 'number', example: 25 }
              }
            },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};