#!/usr/bin/env node

/**
 * ManitoDebug Routing Test
 * This script tests all routing connections between frontend and backend
 */

import fetch from 'node-fetch';

class RoutingTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async run() {
    console.log('🔗 Starting ManitoDebug Routing Test\n');
    
    await this.testServerConnection();
    await this.testAPIEndpoints();
    await this.testWebSocketConnection();
    await this.testFrontendRoutes();
    
    this.printResults();
  }

  async test(testName, testFn) {
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASS' });
      console.log(`✅ ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: ${error.message}`);
    }
  }

  async testServerConnection() {
    console.log('\n🌐 Testing Server Connection...');
    
    await this.test('Server health check', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.status || data.status !== 'ok') {
        throw new Error('Health check returned invalid status');
      }
    });

    await this.test('Server response time', async () => {
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/api/health`);
      const end = Date.now();
      
      if (end - start > 5000) {
        throw new Error(`Server response too slow: ${end - start}ms`);
      }
    });
  }

  async testAPIEndpoints() {
    console.log('\n📡 Testing API Endpoints...');
    
    // Test scan endpoint
    await this.test('POST /api/scan endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: './core',
          options: {
            patterns: ['**/*.js'],
            excludePatterns: ['node_modules/**']
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Scan endpoint failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Scan failed: ${data.error || 'Unknown error'}`);
      }
    });

    // Test upload endpoint
    await this.test('POST /api/upload endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST'
      });
      
      // Should return 400 for missing file, but endpoint should exist
      if (response.status !== 400) {
        throw new Error(`Upload endpoint unexpected response: ${response.status}`);
      }
    });

    // Test projects endpoint
    await this.test('GET /api/projects endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/projects`);
      if (!response.ok) {
        throw new Error(`Projects endpoint failed: ${response.status} ${response.statusText}`);
      }
    });

    // Test metrics endpoint
    await this.test('GET /api/metrics endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/metrics`);
      if (!response.ok) {
        throw new Error(`Metrics endpoint failed: ${response.status} ${response.statusText}`);
      }
    });

    // Test AI providers endpoint
    await this.test('GET /api/ai/providers endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/providers`);
      if (!response.ok) {
        throw new Error(`AI providers endpoint failed: ${response.status} ${response.statusText}`);
      }
    });

    // Test scan queue endpoint
    await this.test('GET /api/scan/queue endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/scan/queue`);
      if (!response.ok) {
        throw new Error(`Scan queue endpoint failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  async testWebSocketConnection() {
    console.log('\n🔌 Testing WebSocket Connection...');
    
    await this.test('WebSocket connection', async () => {
      const WebSocket = (await import('ws')).default;
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3000');
        
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket connection failed: ${error.message}`));
        });
      });
    });

    await this.test('WebSocket message handling', async () => {
      const WebSocket = (await import('ws')).default;
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3000');
        
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket message timeout'));
        }, 5000);
        
        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'ping' }));
        });
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong') {
              clearTimeout(timeout);
              ws.close();
              resolve();
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(new Error(`WebSocket message parsing failed: ${error.message}`));
          }
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket error: ${error.message}`));
        });
      });
    });
  }

  async testFrontendRoutes() {
    console.log('\n🎨 Testing Frontend Routes...');
    
    await this.test('Client development server', async () => {
      const response = await fetch('http://localhost:5173');
      if (!response.ok) {
        throw new Error(`Client server not running: ${response.status} ${response.statusText}`);
      }
    });

    await this.test('Client static assets', async () => {
      const response = await fetch('http://localhost:5173/src/main.jsx');
      if (!response.ok) {
        throw new Error(`Client assets not accessible: ${response.status} ${response.statusText}`);
      }
    });
  }

  printResults() {
    console.log('\n📊 Routing Test Results Summary');
    console.log('===============================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n🎯 Overall Status:');
    if (this.results.failed === 0) {
      console.log('✅ ALL ROUTING TESTS PASSED - Frontend and backend are properly connected!');
    } else {
      console.log('⚠️ Some routing tests failed - Please check the issues above');
    }
  }
}

// Run the tests
const tester = new RoutingTester();
tester.run().catch(error => {
  console.error('Routing test runner failed:', error);
  process.exit(1);
});
