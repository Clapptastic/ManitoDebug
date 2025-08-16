#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fetch from 'node-fetch';

class FullStackMonitor {
  constructor() {
    this.serverPort = 3000;
    this.clientPort = 5173;
    this.monitoring = true;
    this.logs = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    const logEntry = `${prefix} [${timestamp}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        this.log(`Server Health: ${health.status} (uptime: ${health.uptime.toFixed(1)}s)`, 'success');
        return true;
      } else {
        this.log(`Server Health: HTTP ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Server Health: Connection failed - ${error.message}`, 'error');
      return false;
    }
  }

  async checkPortConfiguration() {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/ports`);
      if (response.ok) {
        const config = await response.json();
        if (config.success) {
          this.log(`Port Config: Server=${config.data.server}, Client=${config.data.client}, WebSocket=${config.data.websocket}`, 'success');
          return config.data;
        } else {
          this.log('Port Config: Invalid response', 'error');
          return null;
        }
      } else {
        this.log(`Port Config: HTTP ${response.status}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`Port Config: Connection failed - ${error.message}`, 'error');
      return null;
    }
  }

  async checkClientAccessibility() {
    try {
      const response = await fetch(`http://localhost:${this.clientPort}`);
      if (response.ok) {
        this.log(`Client: Accessible on port ${this.clientPort}`, 'success');
        return true;
      } else {
        this.log(`Client: HTTP ${response.status} on port ${this.clientPort}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Client: Connection failed on port ${this.clientPort} - ${error.message}`, 'error');
      return false;
    }
  }

  async checkDatabaseConnection() {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        if (health.services && health.services.database) {
          this.log(`Database: ${health.services.database.status}`, health.services.database.status === 'ok' ? 'success' : 'error');
          return health.services.database.status === 'ok';
        } else {
          this.log('Database: Status not available', 'error');
          return false;
        }
      } else {
        this.log('Database: Cannot check status', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Database: Connection check failed - ${error.message}`, 'error');
      return false;
    }
  }

  async checkWebSocketConnection() {
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/ports`);
      if (response.ok) {
        const config = await response.json();
        if (config.success) {
          const wsPort = config.data.websocket;
          // Basic TCP connection test
          const net = await import('net');
          const client = new net.Socket();
          
          const connectionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              client.destroy();
              reject(new Error('Connection timeout'));
            }, 3000);
            
            client.connect(wsPort, 'localhost', () => {
              clearTimeout(timeout);
              client.destroy();
              resolve(true);
            });
            
            client.on('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          await connectionPromise;
          this.log(`WebSocket: Accessible on port ${wsPort}`, 'success');
          return true;
        }
      }
      this.log('WebSocket: Cannot check status', 'error');
      return false;
    } catch (error) {
      this.log(`WebSocket: Connection failed - ${error.message}`, 'error');
      return false;
    }
  }

  async checkSystemResources() {
    return new Promise((resolve) => {
      exec('ps aux | grep -E "(node|npm|vite)" | grep -v grep | wc -l', (error, stdout) => {
        if (error) {
          this.log('System Resources: Cannot check processes', 'error');
          resolve(false);
        } else {
          const processCount = parseInt(stdout.trim());
          this.log(`System Resources: ${processCount} Node.js processes running`, 'info');
          resolve(processCount > 0);
        }
      });
    });
  }

  async checkPortUsage() {
    return new Promise((resolve) => {
      exec(`lsof -i :${this.serverPort},${this.clientPort} | grep LISTEN`, (error, stdout) => {
        if (error) {
          this.log('Port Usage: Cannot check port usage', 'error');
          resolve(false);
        } else {
          const lines = stdout.trim().split('\n').filter(line => line.length > 0);
          this.log(`Port Usage: ${lines.length} services listening on monitored ports`, 'info');
          lines.forEach(line => {
            const parts = line.split(/\s+/);
            if (parts.length >= 9) {
              const port = parts[8].split(':')[1];
              this.log(`  Port ${port}: ${parts[0]} (PID: ${parts[1]})`, 'info');
            }
          });
          resolve(lines.length > 0);
        }
      });
    });
  }

  async runHealthCheck() {
    this.log('🔍 RUNNING FULL STACK HEALTH CHECK');
    this.log('=' .repeat(50));
    
    const results = {
      server: await this.checkServerHealth(),
      ports: await this.checkPortConfiguration(),
      client: await this.checkClientAccessibility(),
      database: await this.checkDatabaseConnection(),
      websocket: await this.checkWebSocketConnection(),
      resources: await this.checkSystemResources(),
      portsUsage: await this.checkPortUsage()
    };
    
    this.log('=' .repeat(50));
    this.log('📊 HEALTH CHECK SUMMARY');
    this.log('=' .repeat(50));
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
    
    this.log(`Total Checks: ${totalChecks}`);
    this.log(`Passed: ${passedChecks}`);
    this.log(`Failed: ${totalChecks - passedChecks}`);
    this.log(`Success Rate: ${successRate}%`);
    
    if (passedChecks === totalChecks) {
      this.log('🎉 ALL SYSTEMS OPERATIONAL!', 'success');
    } else {
      this.log('⚠️  Some systems need attention', 'error');
    }
    
    return results;
  }

  async startContinuousMonitoring(intervalMs = 30000) {
    this.log('🚀 STARTING CONTINUOUS MONITORING');
    this.log(`Monitoring interval: ${intervalMs / 1000} seconds`);
    this.log('Press Ctrl+C to stop monitoring');
    this.log('=' .repeat(50));
    
    let checkCount = 0;
    
    const monitor = async () => {
      if (!this.monitoring) return;
      
      checkCount++;
      this.log(`\n📊 HEALTH CHECK #${checkCount} - ${new Date().toLocaleTimeString()}`);
      this.log('-'.repeat(30));
      
      await this.runHealthCheck();
      
      if (this.monitoring) {
        setTimeout(monitor, intervalMs);
      }
    };
    
    // Start monitoring
    await monitor();
  }

  stopMonitoring() {
    this.monitoring = false;
    this.log('🛑 MONITORING STOPPED');
  }
}

// CLI interface
const args = process.argv.slice(2);
const monitor = new FullStackMonitor();

if (args.includes('--continuous') || args.includes('-c')) {
  const interval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || 30000;
  monitor.startContinuousMonitoring(parseInt(interval));
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
} else {
  // Single health check
  monitor.runHealthCheck().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Monitoring failed:', error);
    process.exit(1);
  });
}
