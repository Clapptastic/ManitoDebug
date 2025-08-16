import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Check for token in Authorization header or cookies
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'User not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Account deactivated' 
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: error.message 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = User.verifyToken(token);
        const user = await User.findById(decoded.id);
        if (user && user.is_active) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Invalid token, but continue without authentication
        console.warn('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

// Authorization middleware for role-based access
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access forbidden', 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  }
});

// Rate limiting for general API endpoints (authenticated users get higher limits)
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (req.user) {
      return req.user.role === 'admin' ? 1000 : 100; // Higher limits for authenticated users
    }
    return 1000; // Higher limit for development
  },
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  }
});

// Middleware to extract user info for logging
export const userContext = (req, res, next) => {
  if (req.user) {
    req.userContext = {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    };
  } else {
    req.userContext = {
      userId: 'anonymous',
      email: 'anonymous',
      role: 'anonymous'
    };
  }
  next();
};

// Middleware to ensure email is verified
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource'
    });
  }

  next();
};

// Middleware to validate user owns resource
export const requireResourceOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query[resourceUserIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  authRateLimit,
  apiRateLimit,
  userContext,
  requireEmailVerification,
  requireResourceOwnership
};