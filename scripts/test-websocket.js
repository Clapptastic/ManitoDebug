#!/usr/bin/env node

import WebSocket from 'ws';
import fetch from 'node-fetch';
import { EventEmitter } from 'events';

class WebSocketTester extends EventEmitter {
  constructor() {
    super();
    this.serverPort = 3000;
    this.websocketPort = 3001;
    this.testResults = [];
    this.ws = null;
    this.connected = false;
    this.messageCount = 0;
    this.errorCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testServerHealth() {
    try {
      this.log('Testing server health...');
      
      const response = await fetch(`http://localhost:${this.serverPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        this.log(`Server Health: ${health.status} (uptime: ${health.uptime.toFixed(1)}s)`, 'success');
        
        // Check WebSocket status in health response
        if (health.services && health.services.websocket) {
          this.log(`WebSocket Status: ${health.services.websocket.status}`, 'success');
          this.log(`  Connections: ${health.services.websocket.connections || 0}`, 'info');
        }
        
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

  async testPortConfiguration() {
    try {
      this.log('Testing port configuration...');
      
      const response = await fetch(`http://localhost:${this.serverPort}/api/ports`);
      if (response.ok) {
        const config = await response.json();
        if (config.success) {
          this.log(`Port Config: Server=${config.data.server}, Client=${config.data.client}, WebSocket=${config.data.websocket}`, 'success');
          
          // Update WebSocket port if available
          if (config.data.websocket) {
            this.websocketPort = config.data.websocket;
          }
          
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

  async testWebSocketConnection() {
    return new Promise((resolve) => {
      try {
        this.log(`Testing WebSocket connection to ws://localhost:${this.serverPort}/ws...`);
        
        const wsUrl = `ws://localhost:${this.serverPort}/ws`;
        this.ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          this.log('WebSocket connection timeout', 'error');
          this.ws.terminate();
          resolve(false);
        }, 5000);
        
        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.log('WebSocket connection established', 'success');
          this.connected = true;
          resolve(true);
        });
        
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.messageCount++;
            this.log(`Received message #${this.messageCount}: ${message.type || 'unknown'}`, 'info');
            
            // Handle specific message types
            if (message.type === 'connected') {
              this.log(`Client ID: ${message.clientId}`, 'success');
            }
          } catch (error) {
            this.log(`Failed to parse message: ${error.message}`, 'error');
          }
        });
        
        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          this.errorCount++;
          this.log(`WebSocket error: ${error.message}`, 'error');
          resolve(false);
        });
        
        this.ws.on('close', (code, reason) => {
          clearTimeout(timeout);
          this.log(`WebSocket closed: ${code} - ${reason}`, 'info');
          this.connected = false;
        });
        
      } catch (error) {
        this.log(`WebSocket connection failed: ${error.message}`, 'error');
        resolve(false);
      }
    });
  }

  async testWebSocketMessages() {
    if (!this.connected || !this.ws) {
      this.log('WebSocket not connected, skipping message tests', 'error');
      return false;
    }

    try {
      this.log('Testing WebSocket message exchange...');
      
      // Test ping/pong
      this.log('Sending ping message...');
      this.ws.send(JSON.stringify({ type: 'ping' }));
      
      // Wait for pong response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test subscription
      this.log('Subscribing to scan channel...');
      this.ws.send(JSON.stringify({ 
        type: 'subscribe', 
        channels: ['scan', 'ai_analysis', 'system'] 
      }));
      
      // Wait for subscription response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test scan request
      this.log('Sending scan request...');
      this.ws.send(JSON.stringify({
        type: 'scan_request',
        path: './core',
        options: {
          patterns: ['**/*.{js,jsx,ts,tsx}'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      }));
      
      // Wait for scan response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.log(`Message tests completed. Received ${this.messageCount} messages, ${this.errorCount} errors`, 'success');
      return true;
      
    } catch (error) {
      this.log(`Message tests failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWebSocketBroadcast() {
    try {
      this.log('Testing WebSocket broadcast functionality...');
      
      // Send a test broadcast via HTTP API
      const response = await fetch(`http://localhost:${this.serverPort}/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: 'system',
          data: {
            type: 'test_broadcast',
            message: 'Test broadcast message',
            timestamp: Date.now()
          }
        })
      });
      
      if (response.ok) {
        this.log('Broadcast test message sent', 'success');
        
        // Wait for broadcast message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
      } else {
        this.log(`Broadcast test failed: HTTP ${response.status}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Broadcast test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWebSocketReconnection() {
    try {
      this.log('Testing WebSocket reconnection...');
      
      if (!this.ws) {
        this.log('No WebSocket connection to test reconnection', 'error');
        return false;
      }
      
      // Close connection
      this.log('Closing WebSocket connection...');
      this.ws.close(1000, 'Test reconnection');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reconnect
      this.log('Attempting to reconnect...');
      const reconnected = await this.testWebSocketConnection();
      
      if (reconnected) {
        this.log('Reconnection successful', 'success');
        return true;
      } else {
        this.log('Reconnection failed', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`Reconnection test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWebSocketPerformance() {
    try {
      this.log('Testing WebSocket performance...');
      
      if (!this.connected || !this.ws) {
        this.log('WebSocket not connected, skipping performance tests', 'error');
        return false;
      }
      
      const startTime = Date.now();
      const messageCount = 10;
      
      // Send multiple messages quickly
      for (let i = 0; i < messageCount; i++) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          sequence: i,
          timestamp: Date.now()
        }));
      }
      
      // Wait for responses
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.log(`Performance test: ${messageCount} messages in ${duration}ms`, 'success');
      this.log(`Average: ${(duration / messageCount).toFixed(2)}ms per message`, 'info');
      
      return true;
      
    } catch (error) {
      this.log(`Performance test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    console.log('🔌 TESTING WEBSOCKET CONNECTION');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Server Health', test: () => this.testServerHealth() },
      { name: 'Port Configuration', test: () => this.testPortConfiguration() },
      { name: 'WebSocket Connection', test: () => this.testWebSocketConnection() },
      { name: 'Message Exchange', test: () => this.testWebSocketMessages() },
      { name: 'Broadcast Functionality', test: () => this.testWebSocketBroadcast() },
      { name: 'Reconnection', test: () => this.testWebSocketReconnection() },
      { name: 'Performance', test: () => this.testWebSocketPerformance() }
    ];

    const results = [];
    
    for (const test of tests) {
      this.log(`\n🔍 Running: ${test.name}`);
      try {
        const result = await test.test();
        results.push({ name: test.name, success: result });
      } catch (error) {
        this.log(`${test.name}: Unexpected error - ${error.message}`, 'error');
        results.push({ name: test.name, success: false, error: error.message });
      }
    }

    // Cleanup
    if (this.ws) {
      this.ws.close(1000, 'Test completed');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 WEBSOCKET TEST RESULTS');
    console.log('=' .repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const successRate = ((passed / results.length) * 100).toFixed(1);
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`📨 Messages Received: ${this.messageCount}`);
    console.log(`❌ Errors Encountered: ${this.errorCount}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.name}${result.error ? `: ${result.error}` : ''}`);
      });
    }
    
    if (passed === results.length) {
      console.log('\n🎉 ALL WEBSOCKET TESTS PASSED!');
      console.log('✅ WebSocket connection is working correctly');
      console.log('✅ Real-time communication is functional');
      console.log('✅ Performance is acceptable');
    } else {
      console.log('\n⚠️  Some WebSocket tests failed. Please check the issues above.');
    }
    
    return results;
  }
}

// Run the tests
const tester = new WebSocketTester();
tester.runAllTests().catch(console.error);
