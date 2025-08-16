/**
 * Client-side Port Configuration Utility
 * Provides consistent port configuration across the client application
 */

// Get port configuration from global or environment variables
export const getPortConfig = () => {
  // Check for global port configuration (set by Vite)
  if (typeof __PORT_CONFIG__ !== 'undefined') {
    return __PORT_CONFIG__;
  }
  
  // Fallback to environment variables
  return {
    server: process.env.REACT_APP_SERVER_PORT || 3000,
    client: process.env.REACT_APP_CLIENT_PORT || 5173,
    database: process.env.REACT_APP_DB_PORT || 5432,
    redis: process.env.REACT_APP_REDIS_PORT || 6379,
    websocket: process.env.REACT_APP_WS_PORT || 3000,
    monitoring: process.env.REACT_APP_MONITORING_PORT || 9090
  };
};

// Get server URL with port
export const getServerUrl = () => {
  const config = getPortConfig();
  return `http://localhost:${config.server}`;
};

// Get WebSocket URL with port
export const getWebSocketUrl = () => {
  const config = getPortConfig();
  return `ws://localhost:${config.websocket}`;
};

// Get API endpoint URL
export const getApiUrl = (endpoint) => {
  const serverUrl = getServerUrl();
  return `${serverUrl}/api${endpoint}`;
};

// Validate port configuration
export const validatePortConfig = (config) => {
  const issues = [];
  
  // Check for valid port numbers
  for (const [service, port] of Object.entries(config)) {
    if (typeof port !== 'number' || port < 1 || port > 65535) {
      issues.push(`Invalid port for ${service}: ${port}`);
    }
  }
  
  // Check for port conflicts
  const usedPorts = new Set();
  for (const [service, port] of Object.entries(config)) {
    if (usedPorts.has(port)) {
      issues.push(`Port conflict: ${service} and another service both use port ${port}`);
    }
    usedPorts.add(port);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Log port configuration for debugging
export const logPortConfig = () => {
  const config = getPortConfig();
  const validation = validatePortConfig(config);
  
  console.log('🔧 Port Configuration:', config);
  
  if (!validation.valid) {
    console.warn('⚠️  Port configuration issues:');
    validation.issues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.log('✅ Port configuration is valid');
  }
  
  return config;
};

// Default export
export default {
  getPortConfig,
  getServerUrl,
  getWebSocketUrl,
  getApiUrl,
  validatePortConfig,
  logPortConfig
};
