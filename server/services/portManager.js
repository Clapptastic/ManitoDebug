import { getPortConfig, validatePortConfig, isPortAvailable } from '../config/ports.js';

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
      
      // Get port configuration
      this.config = await getPortConfig(this.environment);
      
      // Validate configuration
      const validation = validatePortConfig(this.config);
      if (!validation.valid) {
        console.warn('⚠️  Port configuration validation issues:');
        validation.issues.forEach(issue => console.warn(`  - ${issue}`));
      }
      
      console.log('✅ Dynamic port configuration:');
      console.log(`  Server: ${this.config.server}`);
      console.log(`  Client: ${this.config.client}`);
      console.log(`  WebSocket: ${this.config.websocket}`);
      console.log(`  Database: ${this.config.database}`);
      console.log(`  Redis: ${this.config.redis}`);
      console.log(`  Monitoring: ${this.config.monitoring}`);
      
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
    
    for (const [service, port] of Object.entries(config)) {
      if (service === 'database' || service === 'redis') {
        // Skip database and redis as they may be in use by actual services
        results[service] = { port, available: true, reason: 'Skipped (database service)' };
        continue;
      }
      
      try {
        const available = await isPortAvailable(port);
        results[service] = { port, available, reason: available ? 'Available' : 'In use' };
      } catch (error) {
        results[service] = { port, available: false, reason: `Error: ${error.message}` };
      }
    }
    
    return results;
  }

  // Export configuration for client-side use
  exportForClient() {
    const config = this.getConfig();
    return {
      server: config.server,
      client: config.client,
      websocket: config.websocket,
      environment: this.environment
    };
  }
}

// Create singleton instance
const dynamicPortManager = new DynamicPortManager();

export default dynamicPortManager;
