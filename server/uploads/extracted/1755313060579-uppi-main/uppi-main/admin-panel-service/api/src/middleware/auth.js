const jwt = require('jsonwebtoken');
const { getUserFromToken, verifyApiKey, logActivity } = require('../services/supabaseService');
const config = require('../config');
const logger = require('../utils/logger');

// Middleware to authenticate JWT tokens or API keys
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'];
    
    // Try API key authentication first
    if (apiKey) {
      const apiKeyData = await verifyApiKey(apiKey);
      if (apiKeyData) {
        req.user = {
          id: apiKeyData.user_id,
          isApiKey: true,
          apiKeyId: apiKeyData.id,
          permissions: apiKeyData.permissions,
          tenantId: apiKeyData.tenant_id
        };
        return next();
      }
    }
    
    // Try JWT authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // First try to verify with our JWT secret (for service-generated tokens)
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        return next();
      } catch (jwtError) {
        // If that fails, try Supabase user verification
        const user = await getUserFromToken(token);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.profile?.role || 'user',
            tenantId: user.profile?.tenant_id || 'default',
            profile: user.profile
          };
          return next();
        }
      }
    }
    
    return res.status(401).json({
      success: false,
      message: 'Access denied. Valid token or API key required.'
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token or API key'
    });
  }
}

// Middleware to require specific roles
function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // API keys with appropriate permissions are allowed
    if (req.user.isApiKey) {
      const hasPermission = roles.some(role => 
        req.user.permissions.includes(role) || 
        req.user.permissions.includes('admin') ||
        req.user.permissions.includes('super_admin')
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      return next();
    }
    
    // Regular user role check
    const userRole = req.user.role || req.user.profile?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(', ')}`
      });
    }
    
    next();
  };
}

// Middleware to check feature flags
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      const { getFeatureFlag } = require('../services/supabaseService');
      const isEnabled = await getFeatureFlag(featureName, req.user?.id);
      
      if (!isEnabled) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' is not enabled`
        });
      }
      
      next();
    } catch (error) {
      logger.error('Feature flag check error:', error);
      next(); // Allow request to continue on error
    }
  };
}

// Middleware to log API usage
function logApiUsage() {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture original res.end
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Log the API usage
      const { recordApiUsage } = require('../services/supabaseService');
      recordApiUsage({
        userId: req.user?.id,
        endpoint: req.route?.path || req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0,
        responseSize: chunk ? Buffer.byteLength(chunk, encoding) : 0,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        apiKeyId: req.user?.apiKeyId,
        metadata: {
          query: req.query,
          params: req.params
        }
      }).catch(error => {
        logger.error('Failed to log API usage:', error);
      });
      
      // Call original end
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}

// Middleware to validate tenant access
function validateTenant() {
  return (req, res, next) => {
    const requestedTenant = req.headers['x-tenant-id'] || req.query.tenantId || 'default';
    const userTenant = req.user?.tenantId || 'default';
    
    // Super admins can access any tenant
    if (req.user?.role === 'super_admin' || req.user?.permissions?.includes('super_admin')) {
      req.tenantId = requestedTenant;
      return next();
    }
    
    // Regular users can only access their own tenant
    if (requestedTenant !== userTenant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to requested tenant'
      });
    }
    
    req.tenantId = userTenant;
    next();
  };
}

// Middleware to rate limit API calls
function rateLimit(options = {}) {
  const { 
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip || 'anonymous'
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [requestKey, times] of requests.entries()) {
      requests.set(requestKey, times.filter(time => time > windowStart));
      if (requests.get(requestKey).length === 0) {
        requests.delete(requestKey);
      }
    }
    
    // Check current requests
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    currentRequests.push(now);
    requests.set(key, currentRequests);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - currentRequests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requireFeature,
  logApiUsage,
  validateTenant,
  rateLimit
};