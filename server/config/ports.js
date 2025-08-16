import { createServer } from 'net';

/**
 * Port Management Configuration
 * Best practices for port assignment and management
 */
class PortManager {
  constructor() {
    this.defaultPorts = {
      server: process.env.PORT || 3000,
      client: process.env.CLIENT_PORT || 5173,
      database: process.env.DB_PORT || 5432,
      redis: process.env.REDIS_PORT || 6379,
      websocket: process.env.WS_PORT || 3000, // Same as server for simplicity
      monitoring: process.env.MONITORING_PORT || 9090
    };
    
    this.portRanges = {
      development: { min: 3000, max: 3999 },
      testing: { min: 4000, max: 4999 },
      staging: { min: 5000, max: 5999 },
      production: { min: 80, max: 443 }
    };
    
    this.reservedPorts = new Set([
      22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 6379, 8080, 8443
    ]);
  }

  /**
   * Check if a port is available
   * @param {number} port - Port to check
   * @returns {Promise<boolean>} - True if port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find an available port in a range
   * @param {number} startPort - Starting port number
   * @param {number} endPort - Ending port number
   * @returns {Promise<number|null>} - Available port or null
   */
  async findAvailablePort(startPort, endPort) {
    for (let port = startPort; port <= endPort; port++) {
      if (this.reservedPorts.has(port)) continue;
      
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    return null;
  }

  /**
   * Get port configuration for environment
   * @param {string} environment - Environment name
   * @returns {Promise<Object>} - Port configuration
   */
  async getPortConfig(environment = 'development') {
    const range = this.portRanges[environment] || this.portRanges.development;
    
    // Try to use default ports first
    const config = { ...this.defaultPorts };
    
    // Check each port and find alternatives if needed
    for (const [service, defaultPort] of Object.entries(config)) {
      if (!(await this.isPortAvailable(defaultPort))) {
        console.warn(`⚠️  Port ${defaultPort} for ${service} is in use, finding alternative...`);
        
        const alternativePort = await this.findAvailablePort(range.min, range.max);
        if (alternativePort) {
          config[service] = alternativePort;
          console.log(`✅ ${service} will use port ${alternativePort}`);
        } else {
          console.error(`❌ No available port found for ${service} in range ${range.min}-${range.max}`);
        }
      }
    }
    
    return config;
  }

  /**
   * Validate port configuration
   * @param {Object} config - Port configuration
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    const issues = [];
    
    // Check for port conflicts
    const usedPorts = new Set();
    for (const [service, port] of Object.entries(config)) {
      if (usedPorts.has(port)) {
        issues.push(`Port conflict: ${service} and another service both use port ${port}`);
      }
      usedPorts.add(port);
    }
    
    // Check for reserved ports
    for (const [service, port] of Object.entries(config)) {
      if (this.reservedPorts.has(port)) {
        issues.push(`Warning: ${service} uses reserved port ${port}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get environment-specific port configuration
   * @param {string} environment - Environment name
   * @returns {Object} - Environment-specific ports
   */
  getEnvironmentPorts(environment = 'development') {
    const baseConfig = {
      development: {
        server: 3000,
        client: 5173,
        database: 5432,
        redis: 6379,
        websocket: 3000,
        monitoring: 9090
      },
      testing: {
        server: 4000,
        client: 4173,
        database: 5433,
        redis: 6380,
        websocket: 4000,
        monitoring: 9091
      },
      staging: {
        server: 5000,
        client: 5173,
        database: 5432,
        redis: 6379,
        websocket: 5000,
        monitoring: 9090
      },
      production: {
        server: 80,
        client: 443,
        database: 5432,
        redis: 6379,
        websocket: 80,
        monitoring: 9090
      }
    };
    
    return baseConfig[environment] || baseConfig.development;
  }
}

// Create singleton instance
const portManager = new PortManager();

// Export configuration functions
export const getPortConfig = (environment) => portManager.getPortConfig(environment);
export const isPortAvailable = (port) => portManager.isPortAvailable(port);
export const findAvailablePort = (start, end) => portManager.findAvailablePort(start, end);
export const validatePortConfig = (config) => portManager.validateConfig(config);
export const getEnvironmentPorts = (environment) => portManager.getEnvironmentPorts(environment);

// Export default configuration
export const defaultPorts = portManager.defaultPorts;
export const portRanges = portManager.portRanges;

export default portManager;
