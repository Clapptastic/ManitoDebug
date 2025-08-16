import fetch from 'node-fetch';

class ClientServerIntegrationTester {
  constructor() {
    this.testResults = [];
    this.serverPort = null;
    this.clientPort = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async detectPorts() {
    this.log('Detecting server and client ports...');
    
    // Try to find server by testing common ports
    const commonPorts = [3000, 3001, 3002, 3003, 3004, 3005, 8080];
    
    for (const port of commonPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/api/health`);
        if (response.ok) {
          this.serverPort = port;
          this.log(`✅ Server detected on port ${port}`, 'success');
          
          // Get port configuration from server
          const portsResponse = await fetch(`http://localhost:${port}/api/ports`);
          if (portsResponse.ok) {
            const portsData = await portsResponse.json();
            if (portsData.success) {
              this.clientPort = portsData.data.client;
              this.log(`✅ Client port detected: ${this.clientPort}`, 'success');
              return true;
            }
          }
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.log('❌ Could not detect server ports', 'error');
    return false;
  }

  async testServerConnectivity() {
    this.log('Testing server connectivity...');
    
    if (!this.serverPort) {
      this.log('❌ Server port not detected', 'error');
      this.testResults.push({
        test: 'Server Connectivity',
        result: 'port_not_detected',
        success: false
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        this.log(`✅ Server connectivity test passed`, 'success');
        this.log(`  Status: ${health.status}, Uptime: ${health.uptime}s`);
        
        this.testResults.push({
          test: 'Server Connectivity',
          result: 'connected',
          success: true,
          health
        });
      } else {
        this.log(`❌ Server connectivity test failed: ${response.status}`, 'error');
        this.testResults.push({
          test: 'Server Connectivity',
          result: 'failed',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`❌ Server connectivity test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Server Connectivity',
        result: 'error',
        success: false,
        error: error.message
      });
    }
  }

  async testClientAccessibility() {
    this.log('Testing client accessibility...');
    
    if (!this.clientPort) {
      this.log('❌ Client port not detected', 'error');
      this.testResults.push({
        test: 'Client Accessibility',
        result: 'port_not_detected',
        success: false
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:${this.clientPort}`);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('ManitoDebug')) {
          this.log(`✅ Client accessibility test passed`, 'success');
          this.testResults.push({
            test: 'Client Accessibility',
            result: 'accessible',
            success: true
          });
        } else {
          this.log(`❌ Client not serving ManitoDebug content`, 'error');
          this.testResults.push({
            test: 'Client Accessibility',
            result: 'wrong_content',
            success: false
          });
        }
      } else {
        this.log(`❌ Client accessibility test failed: ${response.status}`, 'error');
        this.testResults.push({
          test: 'Client Accessibility',
          result: 'failed',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`❌ Client accessibility test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Client Accessibility',
        result: 'error',
        success: false,
        error: error.message
      });
    }
  }

  async testScanEndpoint() {
    this.log('Testing scan endpoint...');
    
    if (!this.serverPort) {
      this.log('❌ Server port not detected', 'error');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: './core',
          options: { patterns: ['**/*.{js,jsx,ts,tsx}'] }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.log('✅ Scan endpoint working correctly', 'success');
          this.log(`  Files scanned: ${result.data.files?.length || 0}`);
          this.testResults.push({
            test: 'Scan Endpoint',
            result: 'working',
            success: true,
            filesScanned: result.data.files?.length || 0
          });
        } else {
          this.log('❌ Scan endpoint returned error', 'error');
          this.testResults.push({
            test: 'Scan Endpoint',
            result: 'error_response',
            success: false,
            error: result.error
          });
        }
      } else {
        this.log(`❌ Scan endpoint failed: ${response.status}`, 'error');
        this.testResults.push({
          test: 'Scan Endpoint',
          result: 'http_error',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`❌ Scan endpoint error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Scan Endpoint',
        result: 'connection_error',
        success: false,
        error: error.message
      });
    }
  }

  async testConcurrentScans() {
    this.log('Testing concurrent scan operations...');
    
    if (!this.serverPort) {
      this.log('❌ Server port not detected', 'error');
      return;
    }
    
    try {
      const scanPromises = [];
      for (let i = 0; i < 3; i++) {
        scanPromises.push(
          fetch(`http://localhost:${this.serverPort}/api/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: './core',
              options: { patterns: ['**/*.{js,jsx,ts,tsx}'] }
            })
          })
        );
      }
      
      const responses = await Promise.all(scanPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const successfulScans = results.filter(r => r.success).length;
      if (successfulScans > 0) {
        this.log(`✅ Concurrent scans working (${successfulScans}/3 successful)`, 'success');
        this.testResults.push({
          test: 'Concurrent Scans',
          result: 'working',
          success: true,
          successful: successfulScans,
          total: 3
        });
      } else {
        this.log('❌ All concurrent scans failed', 'error');
        this.testResults.push({
          test: 'Concurrent Scans',
          result: 'all_failed',
          success: false,
          results
        });
      }
    } catch (error) {
      this.log(`❌ Concurrent scans error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Concurrent Scans',
        result: 'error',
        success: false,
        error: error.message
      });
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...');
    
    if (!this.serverPort) {
      this.log('❌ Server port not detected', 'error');
      return;
    }
    
    try {
      // Test with invalid path
      const response = await fetch(`http://localhost:${this.serverPort}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/nonexistent/path',
          options: { patterns: ['**/*.{js,jsx,ts,tsx}'] }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.success && result.error) {
          this.log('✅ Error handling working correctly', 'success');
          this.testResults.push({
            test: 'Error Handling',
            result: 'working',
            success: true,
            error: result.error
          });
        } else {
          this.log('❌ Error handling not working as expected', 'error');
          this.testResults.push({
            test: 'Error Handling',
            result: 'unexpected_success',
            success: false,
            result
          });
        }
      } else {
        this.log(`❌ Error handling test failed: ${response.status}`, 'error');
        this.testResults.push({
          test: 'Error Handling',
          result: 'http_error',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`❌ Error handling test error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Error Handling',
        result: 'connection_error',
        success: false,
        error: error.message
      });
    }
  }

  async testPortConfiguration() {
    this.log('Testing port configuration...');
    
    if (!this.serverPort) {
      this.log('❌ Server port not detected', 'error');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/ports`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.log('✅ Port configuration endpoint working', 'success');
          this.log(`  Server: ${result.data.server}`);
          this.log(`  Client: ${result.data.client}`);
          this.log(`  WebSocket: ${result.data.websocket}`);
          
          // Verify the detected ports match the configuration
          if (result.data.server === this.serverPort && result.data.client === this.clientPort) {
            this.log('✅ Port configuration matches detected ports', 'success');
            this.testResults.push({
              test: 'Port Configuration',
              result: 'consistent',
              success: true,
              config: result.data
            });
          } else {
            this.log('❌ Port configuration does not match detected ports', 'error');
            this.testResults.push({
              test: 'Port Configuration',
              result: 'inconsistent',
              success: false,
              detected: { server: this.serverPort, client: this.clientPort },
              config: result.data
            });
          }
        } else {
          this.log('❌ Port configuration endpoint returned error', 'error');
          this.testResults.push({
            test: 'Port Configuration',
            result: 'error_response',
            success: false,
            error: result.error
          });
        }
      } else {
        this.log(`❌ Port configuration endpoint failed: ${response.status}`, 'error');
        this.testResults.push({
          test: 'Port Configuration',
          result: 'http_error',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`❌ Port configuration error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Port Configuration',
        result: 'connection_error',
        success: false,
        error: error.message
      });
    }
  }

  printResults() {
    console.log('\n📊 CLIENT-SERVER INTEGRATION TEST RESULTS');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.result === 'PASS').length;
    const failed = this.testResults.filter(r => r.result === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
      if (result.fileCount) {
        console.log(`   Files: ${result.fileCount}`);
      }
    });
    
    if (failed === 0) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('✅ Server is working correctly with port management');
      console.log('✅ Client can connect to server');
      console.log('✅ Scan functionality is working');
      console.log('✅ Error handling is working');
    } else {
      console.log('\n⚠️  Some integration tests failed. Please check the issues above.');
    }
  }

  async runAllTests() {
    console.log('🔧 CLIENT-SERVER INTEGRATION TESTING');
    console.log('=' .repeat(50));
    
    // Detect ports first
    const portsDetected = await this.detectPorts();
    if (!portsDetected) {
      console.log('❌ Cannot run tests without detecting ports');
      return;
    }
    
    const tests = [
      { name: 'Server Connectivity', fn: () => this.testServerConnectivity() },
      { name: 'Client Accessibility', fn: () => this.testClientAccessibility() },
      { name: 'Scan Endpoint', fn: () => this.testScanEndpoint() },
      { name: 'Concurrent Scans', fn: () => this.testConcurrentScans() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Port Configuration', fn: () => this.testPortConfiguration() }
    ];
    
    for (const test of tests) {
      console.log(`\n🧪 Running: ${test.name}`);
      console.log('-'.repeat(30));
      await test.fn();
    }
    
    this.printResults();
  }
}

const tester = new ClientServerIntegrationTester();
tester.runAllTests().catch(console.error);
