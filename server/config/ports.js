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
      websocket: process.env.WS_PORT || 3001, // Different from server by default
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
   * @param {Set<number>} usedPorts - Set of ports already in use (optional)
   * @returns {Promise<number|null>} - Available port or null
   */
  async findAvailablePort(startPort, endPort, usedPorts = new Set()) {
    for (let port = startPort; port <= endPort; port++) {
      if (this.reservedPorts.has(port)) continue;
      if (usedPorts.has(port)) continue;
      
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
    
    const config = { ...this.defaultPorts };
    const usedPorts = new Set(); // Track ports used within this configuration run
    
    // First, check which default ports are already in use
    const portChecks = await Promise.all(
      Object.entries(config).map(async ([service, defaultPort]) => {
        const isAvailable = await this.isPortAvailable(defaultPort);
        return { service, defaultPort, isAvailable };
      })
    );
    
    // Build a map of services that need alternative ports
    const needsAlternative = new Map();
    portChecks.forEach(({ service, defaultPort, isAvailable }) => {
      if (!isAvailable) {
        needsAlternative.set(service, defaultPort);
      }
    });
    
    // Assign alternative ports for services that need them
    for (const [service, originalPort] of needsAlternative) {
      console.warn(`⚠️  Port ${originalPort} for ${service} is in use, finding alternative...`);
      
      const alternativePort = await this.findAvailablePort(range.min, range.max, usedPorts);
      if (alternativePort) {
        config[service] = alternativePort;
        usedPorts.add(alternativePort);
        console.log(`✅ ${service} will use port ${alternativePort}`);
      } else {
        console.error(`❌ No available port found for ${service} in range ${range.min}-${range.max}`);
        // Keep original port but log warning
        console.warn(`⚠️  ${service} will attempt to use occupied port ${originalPort}`);
      }
    }
    
    // Add all assigned ports to usedPorts set
    Object.values(config).forEach(port => usedPorts.add(port));
    
    // Check for conflicts between services (same port assigned to multiple services)
    let hasConflicts = true;
    let conflictResolutionAttempts = 0;
    const maxAttempts = 10;
    
    while (hasConflicts && conflictResolutionAttempts < maxAttempts) {
      conflictResolutionAttempts++;
      hasConflicts = false;
      
      const portCounts = {};
      Object.values(config).forEach(port => {
        portCounts[port] = (portCounts[port] || 0) + 1;
      });
      
      const conflicts = Object.entries(portCounts).filter(([port, count]) => count > 1);
      if (conflicts.length > 0) {
        console.warn(`⚠️  Port conflicts detected (attempt ${conflictResolutionAttempts}):`, conflicts);
        hasConflicts = true;
        
        // Resolve conflicts by finding alternative ports
        for (const [conflictPort, count] of conflicts) {
          const conflictingServices = Object.entries(config).filter(([service, port]) => port === parseInt(conflictPort));
          
          // Keep the first service on the port, find alternatives for others
          for (let i = 1; i < conflictingServices.length; i++) {
            const [service] = conflictingServices[i];
            const alternativePort = await this.findAvailablePort(range.min, range.max, usedPorts);
            if (alternativePort) {
              config[service] = alternativePort;
              usedPorts.add(alternativePort);
              console.log(`✅ ${service} moved to port ${alternativePort} to resolve conflict`);
            } else {
              console.error(`❌ No alternative port found for ${service} to resolve conflict`);
            }
          }
        }
      }
    }
    
    if (hasConflicts) {
      console.error(`❌ Failed to resolve all port conflicts after ${maxAttempts} attempts`);
    } else {
      console.log(`✅ All port conflicts resolved successfully`);
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
    
    // Check for reserved ports (but allow database services to use their standard ports)
    const allowedReservedPorts = {
      database: [5432, 3306, 27017], // PostgreSQL, MySQL, MongoDB
      redis: [6379, 6380] // Redis standard ports
    };
    
    for (const [service, port] of Object.entries(config)) {
      if (this.reservedPorts.has(port)) {
        // Allow database and redis services to use their standard ports
        const isAllowed = allowedReservedPorts[service] && allowedReservedPorts[service].includes(port);
        if (!isAllowed) {
          issues.push(`Warning: ${service} uses reserved port ${port}`);
        }
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
        websocket: 3001, // Different from server for testing
        monitoring: 9090
      },
      testing: {
        server: 4000,
        client: 4173,
        database: 5433,
        redis: 6380,
        websocket: 4001, // Different from server
        monitoring: 9091
      },
      staging: {
        server: 5000,
        client: 5173,
        database: 5432,
        redis: 6379,
        websocket: 5001, // Different from server
        monitoring: 9090
      },
      production: {
        server: 80,
        client: 443,
        database: 5432,
        redis: 6379,
        websocket: 80, // Same as server in production (correct)
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
export const getEnvironmentPorts = () => {
  return {
    development: {
      server: 3000,
      client: 5173,
      database: 5432,
      redis: 6379,
      websocket: 3001,
      monitoring: 9090
    },
    testing: {
      server: 4000,
      client: 4001,
      database: 5432,
      redis: 6379,
      websocket: 4002,
      monitoring: 4003
    },
    staging: {
      server: 5000,
      client: 5001,
      database: 5432,
      redis: 6379,
      websocket: 5002,
      monitoring: 5003
    },
    production: {
      server: 80,
      client: 80,
      database: 5432,
      redis: 6379,
      websocket: 80,
      monitoring: 9090
    }
  };
};

// Export default configuration
export const defaultPorts = portManager.defaultPorts;
export const portRanges = portManager.portRanges;

export default portManager;
