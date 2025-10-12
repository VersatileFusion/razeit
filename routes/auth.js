const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { sendLocalizedResponse, getMessage } = require('../middleware/i18n');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Store OTP codes temporarily (in production, use Redis or database)
const otpStore = new Map();

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send OTP email
async function sendOTPEmail(email, otp, type = 'verification') {
  const subject = type === 'login' ? 'Login Verification Code' : 'Email Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">RaZeit Gaming Platform</h2>
      <p>Your ${type === 'login' ? 'login' : 'verification'} code is:</p>
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #6366f1; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #6c757d; font-size: 12px;">© 2024 RaZeit Gaming Platform. All rights reserved.</p>
    </div>
  `;

  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing:', {
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS,
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT
      });
      
      // In development mode, log the OTP instead of sending email
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n=== DEVELOPMENT MODE - OTP for ${email} ===`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Type: ${type}`);
        console.log(`==========================================\n`);
        return true;
      }
      
      return false;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: html
    });
    console.log(`OTP email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // In development mode, log the OTP instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n=== DEVELOPMENT MODE - OTP for ${email} ===`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Type: ${type}`);
      console.log(`==========================================\n`);
      return true;
    }
    
    return false;
  }
}

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: gamer123
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation failed or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 })
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

    const { email, username, password, firstName, lastName, phone, requireOtp } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, ...(phone ? [{ phone }] : [])]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email, username, or phone number'
      });
    }

    // If OTP is required, store user data and send OTP instead of creating user directly
    if (requireOtp) {
      // Generate OTP
      const otp = generateOTP();
      const otpKey = `register_${email}`;
      
      // Store OTP with user data and 5-minute expiry
      otpStore.set(otpKey, {
        code: otp,
        expiry: Date.now() + (5 * 60 * 1000),
        userData: {
          email,
          username,
          password,
          firstName,
          lastName,
          phone,
          verificationTokens: {
            email: crypto.randomBytes(32).toString('hex')
          }
        }
      });

      // Send OTP email
      try {
        const emailSent = await sendOTPEmail(email, otp, 'verification');
        
        if (!emailSent) {
          console.error('Failed to send OTP email to:', email);
          return res.status(500).json({
            success: false,
            message: 'Failed to send OTP email. Please check your email configuration.'
          });
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Email service error. Please try again later.'
        });
      }

      return res.json({
        success: true,
        message: 'OTP sent to your email',
        requiresOtp: true
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = new User({
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      verificationTokens: {
        email: verificationToken
      }
    });

    await user.save();

    // Send verification email only if email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your RaZeit account',
          html: `
            <h2>Welcome to RaZeit Gaming Platform!</h2>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>If you didn't create this account, please ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.log('Email sending skipped or failed:', emailError.message);
      }
    } else {
      console.log('Email not configured - skipping verification email');
      // Auto-verify in development when email is not configured
      if (process.env.NODE_ENV === 'development') {
        user.isVerified.email = true;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      message: process.env.EMAIL_USER ? 'User registered successfully! Please check your email for verification.' : 'User registered successfully!',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email, username, or phone number
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('login').notEmpty().trim(),
  body('password').notEmpty()
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

    const { login, password, requireOtp } = req.body;

    // Find user by email, username, or phone
    const user = await User.findOne({
      $or: [
        { email: login },
        { username: login },
        { phone: login }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // If OTP is required, send OTP instead of logging in directly
    if (requireOtp) {
      // Generate OTP
      const otp = generateOTP();
      const otpKey = `login_${user.email}`;
      
      // Store OTP with 5-minute expiry
      otpStore.set(otpKey, {
        code: otp,
        expiry: Date.now() + (5 * 60 * 1000)
      });

      // Send OTP email
      const emailSent = await sendOTPEmail(user.email, otp, 'login');
      
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email'
        });
      }

      return res.json({
        success: true,
        message: 'OTP sent to your email',
        requiresOtp: true
      });
    }

    // Update login statistics
    user.statistics.lastLogin = new Date();
    user.statistics.loginCount += 1;
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      'verificationTokens.email': token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    user.isVerified.email = true;
    user.verificationTokens.email = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
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

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.verificationTokens.passwordReset = resetToken;
    await user.save();

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your RaZeit password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email'
    });
  }
});

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 })
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

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      'verificationTokens.passwordReset': token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.verificationTokens.passwordReset = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// Language switching endpoint
router.post('/set-language', authMiddleware, [
  body('language').isIn(['en', 'fa', 'ru'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendLocalizedResponse(res, false, 'common.validation_failed', { errors: errors.array() });
    }

    const { language } = req.body;
    const user = await User.findById(req.user._id);

    // Update user's language preference
    user.preferences.language = language;
    await user.save();

    // Set locale for current request
    req.setLocale(language);
    res.cookie('locale', language, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days

    sendLocalizedResponse(res, true, 'common.success', { language });
  } catch (error) {
    console.error('Set language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set language'
    });
  }
});

// Verify login OTP
router.post('/verify-login-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input'
      });
    }

    const { email, otp } = req.body;
    const otpKey = `login_${email}`;
    const storedOtp = otpStore.get(otpKey);

    if (!storedOtp || storedOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() > storedOtp.expiry) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Find user and verify login
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Clear OTP
    otpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

// Verify register OTP
router.post('/verify-register-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input'
      });
    }

    const { email, otp } = req.body;
    const otpKey = `register_${email}`;
    const storedOtp = otpStore.get(otpKey);

    if (!storedOtp || storedOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() > storedOtp.expiry) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Get user data from stored OTP
    const userData = storedOtp.userData;
    
    // Create user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Clear OTP
    otpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Verify register OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

// Resend login OTP
router.post('/resend-login-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email'
      });
    }

    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpKey = `login_${email}`;
    
    // Store OTP with 5-minute expiry
    otpStore.set(otpKey, {
      code: otp,
      expiry: Date.now() + (5 * 60 * 1000)
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, 'login');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// Resend register OTP
router.post('/resend-register-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email'
      });
    }

    const { email } = req.body;
    const otpKey = `register_${email}`;
    const storedOtp = otpStore.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Update OTP with new code and expiry
    otpStore.set(otpKey, {
      code: otp,
      expiry: Date.now() + (5 * 60 * 1000),
      userData: storedOtp.userData
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, 'verification');
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend register OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

module.exports = router;