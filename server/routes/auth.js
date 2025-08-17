import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { authenticate, authRateLimit, adminOnly } from '../middleware/auth.js';
import { emailSchemas, emailValidation } from '../utils/emailValidation.js';
import enhancedDb from '../services/enhancedDatabase.js';

const router = express.Router();

// Validation schemas using new email validation
const registerSchema = Joi.object({
  email: emailSchemas.registration,
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required()
});

const loginSchema = Joi.object({
  email: emailSchemas.login,
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required()
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  email: emailSchemas.profileUpdate,
  settings: Joi.object().optional()
});

// Register new user
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const user = await User.create(value);
    const token = user.generateToken();

    // Create session
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    await user.createSession(token, userAgent, ipAddress);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;
    const user = await User.authenticate(email, password);
    const token = user.generateToken();

    // Create session
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    await user.createSession(token, userAgent, ipAddress);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await req.user.invalidateSession(token);
    }

    // Clear cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const updatedUser = await req.user.update(value);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Profile update failed',
      message: error.message
    });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const { current_password, new_password } = value;

    // Verify current password
    const isValid = await bcrypt.compare(current_password, req.user.password_hash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(new_password, saltRounds);
    
    await enhancedDb.update('users', { 
      password_hash,
      updated_at: new Date()
    }, { 
      where: 'id = $1', 
      whereParams: [req.user.id] 
    });

    // Invalidate all sessions to force re-login
    await req.user.invalidateSession();

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Password change failed',
      message: error.message
    });
  }
});

// Get user sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await req.user.getSessions();
    
    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session.id,
          user_agent: session.user_agent,
          ip_address: session.ip_address,
          created_at: session.created_at,
          expires_at: session.expires_at
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions',
      message: error.message
    });
  }
});

// Revoke session
router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await enhancedDb.delete('user_sessions', { 
      where: 'id = $1 AND user_id = $2', 
      whereParams: [sessionId, req.user.id] 
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session',
      message: error.message
    });
  }
});

// Get email configuration (admin only)
router.get('/email-config', adminOnly, async (req, res) => {
  try {
    const config = emailValidation.getConfig();
    
    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get email configuration',
      message: error.message
    });
  }
});

// Update email configuration (admin only)
router.put('/email-config', adminOnly, async (req, res) => {
  try {
    const { allowedDomains } = req.body;
    
    if (!Array.isArray(allowedDomains)) {
      return res.status(400).json({
        success: false,
        error: 'allowedDomains must be an array'
      });
    }

    // Update environment variable (this would need to be persisted to a config file in production)
    process.env.ALLOWED_EMAIL_DOMAINS = allowedDomains.join(',');
    
    // Reload email configuration
    emailValidation.loadFromEnvironment();

    res.json({
      success: true,
      message: 'Email configuration updated successfully',
      data: emailValidation.getConfig()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update email configuration',
      message: error.message
    });
  }
});

// Test email validation
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const validation = emailValidation.validate(email);
    
    res.json({
      success: true,
      data: {
        email,
        validation,
        isManitoEmail: emailValidation.isManitoEmail(email),
        allowedDomains: emailValidation.getAllowedDomains()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Email validation test failed',
      message: error.message
    });
  }
});

export default router;