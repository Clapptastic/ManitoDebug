import { getPortConfig, validateConfig, healthCheck } from '../config/ports.js';

class DynamicPortManager {
  constructor() {
    this.config = null;
    this.environment = process.env.NODE_ENV || 'development';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return this.config;
    }

    try {
      console.log(`🔧 Initializing dynamic port manager for ${this.environment} environment...`);
      
      // Get port configuration using new dynamic manager
      const portConfigResult = await getPortConfig(this.environment);
      this.config = portConfigResult.ports;
      
      // Validate configuration
      const validation = validateConfig(this.config);
      if (!validation.valid) {
        console.warn('⚠️  Port configuration validation issues:');
        validation.issues.forEach(issue => console.warn(`  - ${issue}`));
      }
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️  Port configuration warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      console.log('✅ Dynamic port configuration:');
      console.log(`  Server: ${this.config.server}`);
      console.log(`  Client: ${this.config.client}`);
      console.log(`  WebSocket: ${this.config.websocket}`);
      console.log(`  Database: ${this.config.database}`);
      console.log(`  Redis: ${this.config.redis}`);
      console.log(`  Monitoring: ${this.config.monitoring}`);
      
      // Log assignment results
      if (portConfigResult.assignmentResults) {
        console.log('📊 Port assignment results:');
        portConfigResult.assignmentResults.forEach(result => {
          if (result.error) {
            console.error(`  ❌ ${result.service}: ${result.error}`);
          } else {
            console.log(`  ✅ ${result.service}: port ${result.port} (${result.strategy})`);
          }
        });
      }
      
      this.initialized = true;
      return this.config;
    } catch (error) {
      console.error('❌ Failed to initialize dynamic port manager:', error.message);
      throw error;
    }
  }

  getConfig() {
    if (!this.initialized) {
      throw new Error('Port manager not initialized. Call initialize() first.');
    }
    return this.config;
  }

  getServerPort() {
    return this.getConfig().server;
  }

  getClientPort() {
    return this.getConfig().client;
  }

  getWebSocketPort() {
    return this.getConfig().websocket;
  }

  getDatabasePort() {
    return this.getConfig().database;
  }

  getRedisPort() {
    return this.getConfig().redis;
  }

  getMonitoringPort() {
    return this.getConfig().monitoring;
  }

  getServerUrl() {
    return `http://localhost:${this.getServerPort()}`;
  }

  getClientUrl() {
    return `http://localhost:${this.getClientPort()}`;
  }

  getWebSocketUrl() {
    return `ws://localhost:${this.getWebSocketPort()}`;
  }

  async validatePorts() {
    const config = this.getConfig();
    const results = {};
    
    // Use the new health check function
    const health = await healthCheck();
    
    for (const [service, port] of Object.entries(config)) {
      if (service === 'database' || service === 'redis') {
        // Skip database and redis as they may be in use by actual services
        results[service] = { port, available: true, reason: 'Skipped (database service)' };
        continue;
      }
      
      if (health[service]) {
        results[service] = {
          port,
          available: health[service].healthy,
          reason: health[service].healthy ? 'Available' : health[service].reason || 'In use'
        };
      } else {
        results[service] = { port, available: false, reason: 'Health check failed' };
      }
    }
    
    return results;
  }

  async testPortManagement() {
    console.log('🧪 Testing dynamic port management...');
    
    try {
      // Test port validation
      const validation = await this.validatePorts();
      let allAvailable = true;
      
      for (const [service, result] of Object.entries(validation)) {
        if (!result.available) {
          console.warn(`⚠️  ${service} port ${result.port} is not available: ${result.reason}`);
          allAvailable = false;
        } else {
          console.log(`✅ ${service} port ${result.port} is available`);
        }
      }
      
      if (allAvailable) {
        console.log('✅ Dynamic port management test passed');
        return true;
      } else {
        console.warn('⚠️  Some dynamic port management issues remain. Please check the issues above.');
        return false;
      }
    } catch (error) {
      console.error('❌ Dynamic port management test failed:', error.message);
      return false;
    }
  }

  getPortInfo() {
    return {
      config: this.getConfig(),
      environment: this.environment,
      initialized: this.initialized,
      urls: {
        server: this.getServerUrl(),
        client: this.getClientUrl(),
        websocket: this.getWebSocketUrl()
      }
    };
  }
}

// Create singleton instance
const dynamicPortManager = new DynamicPortManager();

export default dynamicPortManager;
