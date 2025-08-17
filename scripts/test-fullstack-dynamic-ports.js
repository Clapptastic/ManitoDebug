#!/usr/bin/env node

/**
 * Full Stack Dynamic Port Management Test
 * 
 * This script tests the complete full stack with dynamic port management:
 * - Server startup with dynamic port assignment
 * - Client startup with dynamic port assignment
 * - WebSocket connection with inherited port
 * - API endpoints functionality
 * - Port configuration API
 * - Health checks
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { setTimeout as sleep } from 'timers/promises';

class FullStackDynamicPortTest {
  constructor() {
    this.serverProcess = null;
    this.clientProcess = null;
    this.serverPort = null;
    this.clientPort = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(name, testFunction) {
    try {
      this.log(`Running test: ${name}`);
      const result = await testFunction();
      this.testResults.push({ name, status: 'PASS', result });
      this.log(`✅ ${name} - PASSED`, 'success');
      return result;
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
      throw error;
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.log('Starting server with dynamic port management...');
      
      this.serverProcess = spawn('npm', ['run', 'dev:server'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          ENABLE_DYNAMIC_PORTS: 'true',
          PORT_MANAGER_STRATEGY: 'minimal'
        }
      });

      let serverOutput = '';
      let portFound = false;

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        
        // Look for port assignment
        if (!portFound && output.includes('Manito API Server running on port')) {
          const match = output.match(/Manito API Server running on port (\d+)/);
          if (match) {
            this.serverPort = parseInt(match[1]);
            portFound = true;
            this.log(`✅ Server started on port ${this.serverPort}`, 'success');
            resolve();
          }
        }
        
        // Check for server ready
        if (output.includes('Available endpoints:')) {
          this.log('✅ Server is ready and accepting connections', 'success');
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Error') || output.includes('Failed')) {
          this.log(`Server error: ${output}`, 'error');
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`Server process error: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!portFound) {
          this.log('Server startup timeout', 'error');
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async startClient() {
    return new Promise((resolve, reject) => {
      this.log('Starting client with dynamic port management...');
      
      this.clientProcess = spawn('npm', ['run', 'dev:client'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          ENABLE_DYNAMIC_PORTS: 'true',
          CLIENT_PORT_RANGE_START: '3001',
          CLIENT_PORT_RANGE_END: '3999'
        }
      });

      let clientOutput = '';
      let portFound = false;

      this.clientProcess.stdout.on('data', (data) => {
        const output = data.toString();
        clientOutput += output;
        
        // Look for Vite server port
        if (!portFound && output.includes('Local:')) {
          const match = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
          if (match) {
            this.clientPort = parseInt(match[1]);
            portFound = true;
            this.log(`✅ Client started on port ${this.clientPort}`, 'success');
            resolve();
          }
        }
      });

      this.clientProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Error') || output.includes('Failed')) {
          this.log(`Client error: ${output}`, 'error');
        }
      });

      this.clientProcess.on('error', (error) => {
        this.log(`Client process error: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!portFound) {
          this.log('Client startup timeout', 'error');
          reject(new Error('Client startup timeout'));
        }
      }, 30000);
    });
  }

  async testServerHealth() {
    await sleep(2000); // Wait for server to be fully ready
    
    const response = await fetch(`http://localhost:${this.serverPort}/api/health`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    if (data.status !== 'ok') {
      throw new Error(`Health check returned invalid status: ${data.status}`);
    }
    
    return data;
  }

  async testPortConfiguration() {
    const response = await fetch(`http://localhost:${this.serverPort}/api/ports`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Port configuration API failed: ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(`Port configuration API returned error: ${data.error}`);
    }
    
    // Verify port configuration
    const config = data.data;
    if (config.server !== this.serverPort) {
      throw new Error(`Server port mismatch: expected ${this.serverPort}, got ${config.server}`);
    }
    
    if (config.websocket !== this.serverPort) {
      throw new Error(`WebSocket port should inherit server port: expected ${this.serverPort}, got ${config.websocket}`);
    }
    
    return config;
  }

  async testClientConnection() {
    const response = await fetch(`http://localhost:${this.clientPort}`);
    
    if (!response.ok) {
      throw new Error(`Client connection failed: ${response.status}`);
    }
    
    return { status: response.status, url: response.url };
  }

  async testWebSocketConnection() {
    // Test WebSocket connection (basic test)
    const WebSocket = (await import('ws')).default;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${this.serverPort}/ws`);
      
      ws.on('open', () => {
        this.log('✅ WebSocket connection established', 'success');
        ws.close();
        resolve({ connected: true });
      });
      
      ws.on('error', (error) => {
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Full Stack Dynamic Port Management Test\n');
    
    try {
      // Test 1: Start server with dynamic port management
      await this.runTest('Server Startup', () => this.startServer());
      
      // Test 2: Start client with dynamic port management
      await this.runTest('Client Startup', () => this.startClient());
      
      // Test 3: Server health check
      await this.runTest('Server Health Check', () => this.testServerHealth());
      
      // Test 4: Port configuration API
      await this.runTest('Port Configuration API', () => this.testPortConfiguration());
      
      // Test 5: Client connection
      await this.runTest('Client Connection', () => this.testClientConnection());
      
      // Test 6: WebSocket connection
      await this.runTest('WebSocket Connection', () => this.testWebSocketConnection());
      
      // Test 7: Verify port assignments
      await this.runTest('Port Assignment Verification', () => {
        const config = {
          server: this.serverPort,
          client: this.clientPort,
          websocket: this.serverPort // Should inherit server port
        };
        
        this.log(`📊 Final Port Assignments:`);
        this.log(`  Server: ${config.server}`);
        this.log(`  Client: ${config.client}`);
        this.log(`  WebSocket: ${config.websocket}`);
        
        return config;
      });
      
      this.log('\n🎉 All tests completed successfully!');
      this.log('✅ Full stack dynamic port management is working correctly');
      
    } catch (error) {
      this.log(`\n❌ Test suite failed: ${error.message}`, 'error');
      throw error;
    } finally {
      // Cleanup
      this.cleanup();
    }
  }

  cleanup() {
    this.log('Cleaning up processes...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    if (this.clientProcess) {
      this.clientProcess.kill('SIGTERM');
    }
  }

  printResults() {
    this.log('\n📊 Test Results Summary:');
    this.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      this.log(`${icon} ${result.name}: ${result.status}`);
    });
    
    this.log(`\nTotal: ${this.testResults.length} tests`);
    this.log(`Passed: ${passed}`);
    this.log(`Failed: ${failed}`);
    
    if (failed === 0) {
      this.log('\n🎉 All tests passed! Full stack dynamic port management is working correctly.');
    } else {
      this.log('\n❌ Some tests failed. Please check the logs above.');
    }
  }
}

// Run the test suite
const testSuite = new FullStackDynamicPortTest();

testSuite.runAllTests()
  .then(() => {
    testSuite.printResults();
    process.exit(0);
  })
  .catch((error) => {
    testSuite.printResults();
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
