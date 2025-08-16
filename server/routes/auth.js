import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import { authenticate, authRateLimit, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required()
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().optional(),
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
    // Clear cookie
    res.clearCookie('token');

    // Revoke session (optional - token will expire anyway)
    // You could implement session tracking if needed

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

    await req.user.update(value);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user.toJSON()
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
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const { current_password, new_password } = value;
    await req.user.changePassword(current_password, new_password);

    // Revoke all other sessions for security
    await req.user.revokeAllSessions();

    // Generate new token
    const token = req.user.generateToken();
    
    // Create new session
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    await req.user.createSession(token, userAgent, ipAddress);

    // Set new cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token
      }
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
          created_at: session.created_at,
          last_accessed: session.last_accessed,
          user_agent: session.user_agent,
          ip_address: session.ip_address
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
    const revoked = await req.user.revokeSession(sessionId);

    if (!revoked) {
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

// Revoke all sessions
router.delete('/sessions', authenticate, async (req, res) => {
  try {
    const revokedCount = await req.user.revokeAllSessions();

    // Clear current cookie too
    res.clearCookie('token');

    res.json({
      success: true,
      message: `${revokedCount} sessions revoked successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions',
      message: error.message
    });
  }
});

// Verify token (for client-side validation)
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        valid: true,
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      data: {
        valid: false
      }
    });
  }
});

// Admin endpoints
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const users = await User.findAll(limit, offset);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        limit,
        offset
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Admin: Update user role
router.put('/users/:userId/role', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

// Admin: Deactivate user
router.put('/users/:userId/deactivate', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deactivate();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user',
      message: error.message
    });
  }
});

export default router;