import { createServer } from 'net';
import { EventEmitter } from 'events';

/**
 * Dynamic Port Management with Best Practices
 * 
 * Features:
 * - Intelligent port discovery and assignment
 * - Service-aware port selection
 * - Conflict resolution with minimal disruption
 * - Health checks and validation
 * - Port reservation and release
 * - Environment-specific strategies
 */
class DynamicPortManager extends EventEmitter {
  constructor() {
    super();
    
    // Service definitions with requirements
    this.serviceDefinitions = {
      server: {
        preferred: [3000, 3001, 3002, 3003, 3004, 3005],
        range: { min: 3000, max: 3999 },
        priority: 'high',
        requires: ['http'],
        conflicts: ['client']
      },
      client: {
        preferred: [5173, 3000, 3001, 3002, 3003, 3004, 3005],
        range: { min: 3000, max: 3999 },
        priority: 'high',
        requires: ['http'],
        conflicts: ['server']
      },
      websocket: {
        preferred: [], // Will use same port as server
        range: { min: 3000, max: 3999 },
        priority: 'high',
        requires: ['websocket'],
        conflicts: [],
        inheritFrom: 'server'
      },
      database: {
        preferred: [5432, 5433, 5434],
        range: { min: 5432, max: 5439 },
        priority: 'medium',
        requires: ['database'],
        conflicts: []
      },
      redis: {
        preferred: [6379, 6380, 6381],
        range: { min: 6379, max: 6389 },
        priority: 'medium',
        requires: ['cache'],
        conflicts: []
      },
      monitoring: {
        preferred: [9090, 9091, 9092],
        range: { min: 9090, max: 9099 },
        priority: 'low',
        requires: ['http'],
        conflicts: []
      }
    };
    
    // Reserved system ports
    this.reservedPorts = new Set([
      22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 6379, 8080, 8443
    ]);
    
    // Track assigned ports
    this.assignedPorts = new Map();
    this.portHealth = new Map();
    
    // Configuration
    this.config = {
      maxRetries: 5,
      healthCheckTimeout: 5000,
      conflictResolutionStrategy: 'minimal', // 'minimal', 'aggressive', 'conservative'
      enableHealthChecks: true,
      autoReassign: true
    };
  }

  /**
   * Check if a port is available with health validation
   * @param {number} port - Port to check
   * @param {string} service - Service name for context
   * @returns {Promise<{available: boolean, reason?: string}>}
   */
  async checkPortHealth(port, service = 'unknown') {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ available: false, reason: 'timeout' });
      }, this.config.healthCheckTimeout);

      const server = createServer();
      
      server.listen(port, () => {
        clearTimeout(timeout);
        server.once('close', () => {
          resolve({ available: true });
        });
        server.close();
      });
      
      server.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ 
          available: false, 
          reason: error.code || 'unknown',
          error: error.message 
        });
      });
    });
  }

  /**
   * Find optimal port for a service
   * @param {string} service - Service name
   * @param {Set<number>} excludedPorts - Ports to exclude
   * @returns {Promise<{port: number, strategy: string}>}
   */
  async findOptimalPort(service, excludedPorts = new Set()) {
    const definition = this.serviceDefinitions[service];
    if (!definition) {
      throw new Error(`Unknown service: ${service}`);
    }

    // Strategy 1: Use preferred ports first
    for (const preferredPort of definition.preferred) {
      if (excludedPorts.has(preferredPort)) continue;
      
      const health = await this.checkPortHealth(preferredPort, service);
      if (health.available) {
        return { port: preferredPort, strategy: 'preferred' };
      }
    }

    // Strategy 2: Scan range for available ports
    const { min, max } = definition.range;
    for (let port = min; port <= max; port++) {
      if (excludedPorts.has(port) || this.reservedPorts.has(port)) continue;
      
      const health = await this.checkPortHealth(port, service);
      if (health.available) {
        return { port, strategy: 'range_scan' };
      }
    }

    // Strategy 3: Emergency port assignment (outside normal range)
    const emergencyPort = await this.findEmergencyPort(excludedPorts);
    if (emergencyPort) {
      return { port: emergencyPort, strategy: 'emergency' };
    }

    throw new Error(`No available port found for service: ${service}`);
  }

  /**
   * Find emergency port outside normal ranges
   * @param {Set<number>} excludedPorts - Ports to exclude
   * @returns {Promise<number|null>}
   */
  async findEmergencyPort(excludedPorts) {
    // Try ports in 8000-8999 range
    for (let port = 8000; port <= 8999; port++) {
      if (excludedPorts.has(port) || this.reservedPorts.has(port)) continue;
      
      const health = await this.checkPortHealth(port);
      if (health.available) {
        return port;
      }
    }
    return null;
  }

  /**
   * Assign port to service with conflict resolution
   * @param {string} service - Service name
   * @param {Object} options - Assignment options
   * @returns {Promise<{port: number, strategy: string, conflicts: Array}>}
   */
  async assignPort(service, options = {}) {
    const { force = false, preferredPort = null } = options;
    
    // Check if service has a definition
    const definition = this.serviceDefinitions[service];
    if (!definition) {
      // For unknown services, create a temporary definition
      const tempDefinition = {
        preferred: preferredPort ? [preferredPort] : [],
        range: { min: 3000, max: 3999 },
        priority: 'low',
        requires: [],
        conflicts: []
      };
      
      // Use temporary definition for this assignment
      const originalDefinition = this.serviceDefinitions[service];
      this.serviceDefinitions[service] = tempDefinition;
      
      try {
        const result = await this.assignPortInternal(service, options);
        return result;
      } finally {
        // Restore original definition (or remove if it didn't exist)
        if (originalDefinition) {
          this.serviceDefinitions[service] = originalDefinition;
        } else {
          delete this.serviceDefinitions[service];
        }
      }
    }
    
    return await this.assignPortInternal(service, options);
  }

  /**
   * Internal port assignment logic
   * @param {string} service - Service name
   * @param {Object} options - Assignment options
   * @returns {Promise<{port: number, strategy: string, conflicts: Array}>}
   */
  async assignPortInternal(service, options = {}) {
    const { force = false, preferredPort = null } = options;
    
    // Check if service already has a port
    if (this.assignedPorts.has(service) && !force) {
      const existingPort = this.assignedPorts.get(service);
      const health = await this.checkPortHealth(existingPort, service);
      if (health.available) {
        return { 
          port: existingPort, 
          strategy: 'existing', 
          conflicts: [] 
        };
      }
    }

    // Handle inherited ports (e.g., WebSocket inherits from server)
    const definition = this.serviceDefinitions[service];
    if (definition.inheritFrom && this.assignedPorts.has(definition.inheritFrom)) {
      const inheritedPort = this.assignedPorts.get(definition.inheritFrom);
      this.assignedPorts.set(service, inheritedPort);
      console.log(`✅ ${service} inherits port ${inheritedPort} from ${definition.inheritFrom}`);
      return { 
        port: inheritedPort, 
        strategy: 'inherited', 
        conflicts: [] 
      };
    }

    // Build excluded ports list
    const excludedPorts = new Set([...this.assignedPorts.values()]);
    if (preferredPort) {
      excludedPorts.delete(preferredPort); // Allow preferred port
    }

    // Find optimal port
    const { port, strategy } = await this.findOptimalPort(service, excludedPorts);
    
    // Check for conflicts
    const conflicts = this.detectConflicts(service, port);
    
    // Resolve conflicts if any
    if (conflicts.length > 0) {
      const resolution = await this.resolveConflicts(service, port, conflicts);
      if (resolution.resolved) {
        return {
          port: resolution.port,
          strategy: `${strategy}_with_conflict_resolution`,
          conflicts: resolution.conflicts
        };
      }
    }

    // Assign the port
    this.assignedPorts.set(service, port);
    this.portHealth.set(port, { service, lastCheck: Date.now(), healthy: true });
    
    console.log(`✅ ${service} assigned port ${port} (${strategy})`);
    this.emit('portAssigned', { service, port, strategy });
    
    return { port, strategy, conflicts: [] };
  }

  /**
   * Detect potential conflicts for a port assignment
   * @param {string} service - Service name
   * @param {number} port - Port to check
   * @returns {Array} - List of conflicts
   */
  detectConflicts(service, port) {
    const conflicts = [];
    const definition = this.serviceDefinitions[service];
    
    // Check for conflicting services
    for (const [conflictingService, conflictingPort] of this.assignedPorts.entries()) {
      if (conflictingPort === port) {
        const conflictingDef = this.serviceDefinitions[conflictingService];
        if (definition.conflicts.includes(conflictingService) || 
            conflictingDef.conflicts.includes(service)) {
          conflicts.push({
            service: conflictingService,
            port: conflictingPort,
            type: 'service_conflict'
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Resolve port conflicts intelligently
   * @param {string} service - Service requesting port
   * @param {number} requestedPort - Requested port
   * @param {Array} conflicts - List of conflicts
   * @returns {Promise<{resolved: boolean, port?: number, conflicts?: Array}>}
   */
  async resolveConflicts(service, requestedPort, conflicts) {
    const strategy = this.config.conflictResolutionStrategy;
    
    switch (strategy) {
      case 'minimal':
        return await this.resolveConflictsMinimal(service, requestedPort, conflicts);
      case 'aggressive':
        return await this.resolveConflictsAggressive(service, requestedPort, conflicts);
      case 'conservative':
        return await this.resolveConflictsConservative(service, requestedPort, conflicts);
      default:
        return { resolved: false, conflicts };
    }
  }

  /**
   * Minimal conflict resolution - only move conflicting services if necessary
   */
  async resolveConflictsMinimal(service, requestedPort, conflicts) {
    const resolvedConflicts = [];
    
    for (const conflict of conflicts) {
      const conflictService = conflict.service;
      const conflictDef = this.serviceDefinitions[conflictService];
      
      // Try to find alternative port for conflicting service
      const excludedPorts = new Set([...this.assignedPorts.values()]);
      excludedPorts.delete(conflict.port); // Remove current port
      
      try {
        const { port: newPort } = await this.findOptimalPort(conflictService, excludedPorts);
        
        // Update the conflicting service's port
        this.assignedPorts.set(conflictService, newPort);
        resolvedConflicts.push({
          ...conflict,
          newPort,
          resolved: true
        });
        
        console.log(`✅ Resolved conflict: ${conflictService} moved from ${conflict.port} to ${newPort}`);
      } catch (error) {
        resolvedConflicts.push({
          ...conflict,
          resolved: false,
          error: error.message
        });
      }
    }
    
    const allResolved = resolvedConflicts.every(c => c.resolved);
    return {
      resolved: allResolved,
      port: requestedPort,
      conflicts: resolvedConflicts
    };
  }

  /**
   * Aggressive conflict resolution - prioritize the requesting service
   */
  async resolveConflictsAggressive(service, requestedPort, conflicts) {
    // Force reassign all conflicting services
    for (const conflict of conflicts) {
      this.assignedPorts.delete(conflict.service);
    }
    
    return {
      resolved: true,
      port: requestedPort,
      conflicts: conflicts.map(c => ({ ...c, resolved: true, forced: true }))
    };
  }

  /**
   * Conservative conflict resolution - don't move existing services
   */
  async resolveConflictsConservative(service, requestedPort, conflicts) {
    // Find alternative port for the requesting service
    const excludedPorts = new Set([...this.assignedPorts.values()]);
    
    try {
      const { port: alternativePort } = await this.findOptimalPort(service, excludedPorts);
      return {
        resolved: true,
        port: alternativePort,
        conflicts: conflicts.map(c => ({ ...c, resolved: true, alternative: true }))
      };
    } catch (error) {
      return { resolved: false, conflicts };
    }
  }

  /**
   * Get complete port configuration
   * @param {string} environment - Environment name
   * @returns {Promise<Object>} - Complete port configuration
   */
  async getPortConfig(environment = 'development') {
    const services = Object.keys(this.serviceDefinitions);
    const config = {};
    const assignmentResults = [];
    
    // Assign ports for all services
    for (const service of services) {
      try {
        const result = await this.assignPort(service);
        config[service] = result.port;
        assignmentResults.push({ service, ...result });
      } catch (error) {
        console.error(`❌ Failed to assign port for ${service}:`, error.message);
        config[service] = null;
        assignmentResults.push({ service, error: error.message });
      }
    }
    
    // Validate configuration
    const validation = this.validateConfig(config);
    
    return {
      ports: config,
      environment,
      assignmentResults,
      validation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate port configuration
   * @param {Object} config - Port configuration
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    const issues = [];
    const warnings = [];
    
    // Check for null ports
    for (const [service, port] of Object.entries(config)) {
      if (port === null) {
        issues.push(`Service ${service} has no assigned port`);
      }
    }
    
    // Check for port conflicts (but allow WebSocket to share server port)
    const usedPorts = new Map();
    for (const [service, port] of Object.entries(config)) {
      if (port === null) continue;
      
      // Allow WebSocket to share server port
      if (service === 'websocket' && config.server === port) {
        usedPorts.set(port, service);
        continue;
      }
      
      if (usedPorts.has(port)) {
        const conflictingService = usedPorts.get(port);
        // Don't flag WebSocket-server sharing as a conflict
        if (!(service === 'websocket' && conflictingService === 'server') &&
            !(service === 'server' && conflictingService === 'websocket')) {
          issues.push(`Port conflict: ${service} and ${conflictingService} both use port ${port}`);
        }
      } else {
        usedPorts.set(port, service);
      }
    }
    
    // Check for reserved ports
    for (const [service, port] of Object.entries(config)) {
      if (port === null) continue;
      
      if (this.reservedPorts.has(port)) {
        const allowedServices = ['database', 'redis'];
        if (!allowedServices.includes(service)) {
          warnings.push(`Service ${service} uses reserved port ${port}`);
        }
      }
    }
    
    // Check WebSocket configuration
    if (config.websocket !== null && config.server !== null && config.websocket !== config.server) {
      warnings.push(`WebSocket port (${config.websocket}) should match server port (${config.server})`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Release a port assignment
   * @param {string} service - Service name
   */
  releasePort(service) {
    if (this.assignedPorts.has(service)) {
      const port = this.assignedPorts.get(service);
      this.assignedPorts.delete(service);
      this.portHealth.delete(port);
      console.log(`✅ Released port ${port} from ${service}`);
      this.emit('portReleased', { service, port });
    }
  }

  /**
   * Get current port assignments
   * @returns {Object} - Current assignments
   */
  getCurrentAssignments() {
    return Object.fromEntries(this.assignedPorts);
  }

  /**
   * Health check for all assigned ports
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    const health = {};
    
    for (const [service, port] of this.assignedPorts.entries()) {
      const portHealth = await this.checkPortHealth(port, service);
      health[service] = {
        port,
        healthy: portHealth.available,
        lastCheck: new Date().toISOString(),
        reason: portHealth.reason
      };
    }
    
    return health;
  }
}

// Create singleton instance
const portManager = new DynamicPortManager();

// Export functions
export const getPortConfig = (environment) => portManager.getPortConfig(environment);
export const assignPort = (service, options) => portManager.assignPort(service, options);
export const releasePort = (service) => portManager.releasePort(service);
export const getCurrentAssignments = () => portManager.getCurrentAssignments();
export const healthCheck = () => portManager.healthCheck();
export const validateConfig = (config) => portManager.validateConfig(config);

// Export manager instance for advanced usage
export default portManager;
