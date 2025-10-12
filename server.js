const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const { swaggerUi, specs } = require('./config/swagger');
const { setLocale, i18n } = require('./middleware/i18n');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(compression());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // More requests allowed in development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for static assets in development
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/assets/')) {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// i18n middleware (initializes i18n on each request)
app.use(setLocale);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/razeit-gaming-platform')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend assets
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RaZeit Gaming Platform API Documentation'
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/gems', require('./routes/gems'));
app.use('/api/wheel', require('./routes/wheel'));
app.use('/api/services', require('./routes/services'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/steam', require('./routes/steam'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    supportedLanguages: ['en', 'fa', 'ru'],
    currentLanguage: req.language || 'en',
    apiDocumentation: '/api-docs'
  });
});

// Development endpoint to reset rate limit
if (process.env.NODE_ENV === 'development') {
  app.get('/api/reset-rate-limit', (req, res) => {
    // Clear rate limit for current IP
    limiter.resetKey(req.ip);
    res.json({ message: 'Rate limit reset for your IP', ip: req.ip });
  });
}

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Serve frontend index.html for all other routes
  res.sendFile(path.join(__dirname, 'public', 'en', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Supported Languages: English, Persian (فارسی), Russian (Русский)`);
  console.log(`✅ Server is ready to accept connections`);
});

module.exports = app;