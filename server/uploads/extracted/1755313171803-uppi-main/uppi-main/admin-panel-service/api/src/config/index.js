require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  // Database configuration (fallback to direct PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'admin_panel',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'admin-panel-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3001', 'http://localhost:3000'],
  },
  
  // API Keys for external services
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    github: process.env.GITHUB_TOKEN,
  },
  
  // Webhook configuration
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'webhook-secret-change-in-production',
    endpoints: process.env.WEBHOOK_ENDPOINTS 
      ? process.env.WEBHOOK_ENDPOINTS.split(',')
      : [],
  },
  
  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
  },
  
  // Feature flags (can be overridden by database)
  features: {
    typeCoverage: process.env.FEATURE_TYPE_COVERAGE !== 'false',
    packageManagement: process.env.FEATURE_PACKAGE_MANAGEMENT !== 'false',
    githubIntegration: process.env.FEATURE_GITHUB_INTEGRATION === 'true',
    realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES !== 'false',
    webhooks: process.env.FEATURE_WEBHOOKS !== 'false',
    auditLogs: process.env.FEATURE_AUDIT_LOGS !== 'false',
  },
  
  // Application-specific settings
  app: {
    name: process.env.APP_NAME || 'Admin Panel Service',
    version: process.env.APP_VERSION || '1.0.0',
    tenantId: process.env.TENANT_ID || 'default',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@localhost',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    destination: process.env.LOG_DESTINATION || 'console',
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    prometheusPort: process.env.PROMETHEUS_PORT || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  },
  
  // Email configuration (if needed)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      secure: process.env.SMTP_SECURE === 'true',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    from: process.env.EMAIL_FROM || 'noreply@admin-panel.com',
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // limit each IP to 1000 requests per windowMs
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.',
  },
  
  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES 
      ? process.env.UPLOAD_ALLOWED_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    destination: process.env.UPLOAD_DESTINATION || 'uploads/',
  },
  
  // External service URLs
  services: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3001',
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3000',
  },
};