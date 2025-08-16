// Production Security Hardening for Manito
// ========================================

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Enhanced Helmet configuration for production
export const productionHelmet = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    },
    reportOnly: false
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    features: {
      geolocation: [],
      microphone: [],
      camera: [],
      magnetometer: [],
      gyroscope: [],
      speaker: [],
      vibrate: [],
      fullscreen: ["'self'"],
      payment: []
    }
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // MIME type sniffing prevention
  crossOriginEmbedderPolicy: false, // May interfere with some functionality
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  
  // DNS prefetch control
  dnsPrefetchControl: { allow: false },
  
  // Download options for IE
  ieNoOpen: true,
  
  // Origin Agent Cluster
  originAgentCluster: true
});

// Enhanced rate limiting for production
export const productionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Aggressive rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  message: {
    error: 'Too many requests',
    message: 'Strict rate limit exceeded. Please wait before retrying.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Scan-specific rate limiting
export const scanRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // 2 scans per minute
  message: {
    error: 'Scan rate limit exceeded',
    message: 'Too many scan requests. Please wait before starting another scan.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Slow down middleware for additional protection
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipFailedRequests: true,
  skipSuccessfulRequests: false
});

// Input validation and sanitization
export const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .trim();
  };
  
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
};

// File upload security
export const secureFileUpload = (req, res, next) => {
  const allowedTypes = [
    'application/json',
    'text/plain',
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'text/markdown'
  ];
  
  const allowedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
    '.yml', '.yaml', '.xml', '.py', '.rb', '.go', '.rs'
  ];
  
  if (req.file) {
    // Check MIME type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only code files are allowed'
      });
    }
    
    // Check file extension
    const ext = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        error: 'Invalid file extension',
        message: 'File extension not allowed'
      });
    }
    
    // Check file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  next();
};

// Path traversal protection
export const pathTraversalProtection = (req, res, next) => {
  const checkPath = (path) => {
    if (!path) return true;
    
    // Normalize path and check for traversal attempts
    const normalizedPath = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    
    // Check for common traversal patterns
    const dangerousPatterns = [
      '../', '..\\', '..%2f', '..%2F', '..%5c', '..%5C',
      '%2e%2e%2f', '%2e%2e%5c', '..%252f', '..%252F'
    ];
    
    return !dangerousPatterns.some(pattern => 
      normalizedPath.toLowerCase().includes(pattern.toLowerCase())
    );
  };
  
  // Check request body paths
  if (req.body && req.body.path && !checkPath(req.body.path)) {
    return res.status(400).json({
      error: 'Invalid path',
      message: 'Path contains potentially dangerous characters'
    });
  }
  
  // Check query parameters
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key.includes('path') && !checkPath(value)) {
      return res.status(400).json({
        error: 'Invalid path parameter',
        message: 'Path parameter contains potentially dangerous characters'
      });
    }
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0) {
      // If no whitelist provided, allow all (for development)
      return next();
    }
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this endpoint'
      });
    }
    
    next();
  };
};

// API key validation middleware
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      message: 'API key is required for this endpoint'
    });
  }
  
  // In production, validate against a secure store
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /drop.*table/gi, // SQL injection
    /exec.*\(/gi, // Code injection
    /eval.*\(/gi, // Code injection
  ];
  
  const requestString = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  
  const suspiciousActivity = suspiciousPatterns.some(pattern => 
    pattern.test(requestString)
  );
  
  if (suspiciousActivity) {
    console.warn('SECURITY WARNING: Suspicious request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('SECURITY: Authentication/Authorization failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

export default {
  productionHelmet,
  productionRateLimit,
  strictRateLimit,
  scanRateLimit,
  speedLimiter,
  sanitizeInput,
  secureFileUpload,
  pathTraversalProtection,
  ipWhitelist,
  validateApiKey,
  securityLogger
};