import fetch from 'node-fetch';

class FullStackDebugger {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.clientUrl = 'http://localhost:5173';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testServerHealth() {
    this.log('Testing server health...');
    
    try {
      const response = await fetch(`${this.serverUrl}/api/health`);
      const health = await response.json();
      
      this.log(`Server status: ${health.status}`, 'success');
      this.log(`Server uptime: ${health.uptime}s`);
      this.log(`Server environment: ${health.environment}`);
      
      return health.status === 'ok';
    } catch (error) {
      this.log(`Server health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testClientAccessibility() {
    this.log('Testing client accessibility...');
    
    try {
      const response = await fetch(this.clientUrl);
      const html = await response.text();
      
      if (response.ok && html.includes('ManitoDebug')) {
        this.log('Client is accessible', 'success');
        return true;
      } else {
        this.log('Client is not accessible or not loading correctly', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Client accessibility check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testScanEndpoint() {
    this.log('Testing scan endpoint...');
    
    const testCases = [
      {
        name: 'Valid client path',
        path: '/Users/andrewclapp/Desktop/ai debug planning/manito-package/client/src',
        expectedSuccess: true
      },
      {
        name: 'Valid core path',
        path: './core',
        expectedSuccess: true
      },
      {
        name: 'Invalid path',
        path: './nonexistent',
        expectedSuccess: true // Should succeed but return no files
      },
      {
        name: 'Empty path',
        path: '',
        expectedSuccess: false
      }
    ];

    for (const testCase of testCases) {
      this.log(`Testing: ${testCase.name}`);
      
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${this.serverUrl}/api/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: testCase.path,
            options: {
              patterns: ['**/*.{js,jsx,ts,tsx}'],
              excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
            }
          }),
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success === testCase.expectedSuccess) {
            this.log(`✅ ${testCase.name} - Success (${duration}ms)`, 'success');
            if (result.data) {
              this.log(`   Files found: ${result.data.files?.length || 0}`);
            }
          } else {
            this.log(`❌ ${testCase.name} - Unexpected result: ${result.success}`, 'error');
          }
        } else {
          const errorText = await response.text();
          this.log(`❌ ${testCase.name} - HTTP ${response.status}: ${errorText}`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${testCase.name} - Network error: ${error.message}`, 'error');
      }
    }
  }

  async testConcurrentScans() {
    this.log('Testing concurrent scan requests...');
    
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        fetch(`${this.serverUrl}/api/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: './core',
            options: {
              patterns: ['**/*.{js,jsx,ts,tsx}'],
              excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
            }
          }),
        }).then(async (response) => {
          if (response.ok) {
            const result = await response.json();
            return { success: true, files: result.data?.files?.length || 0 };
          } else {
            return { success: false, error: response.status };
          }
        }).catch(error => {
          return { success: false, error: error.message };
        })
      );
    }
    
    const results = await Promise.all(promises);
    
    results.forEach((result, index) => {
      if (result.success) {
        this.log(`✅ Concurrent scan ${index + 1} - Success (${result.files} files)`, 'success');
      } else {
        this.log(`❌ Concurrent scan ${index + 1} - Failed: ${result.error}`, 'error');
      }
    });
  }

  async testErrorHandling() {
    this.log('Testing error handling...');
    
    const errorTests = [
      {
        name: 'Malformed JSON',
        body: '{"invalid": json}',
        expectedStatus: 400
      },
      {
        name: 'Missing path',
        body: '{"options": {"patterns": ["**/*.js"]}}',
        expectedStatus: 400
      },
      {
        name: 'Invalid options',
        body: '{"path": "./core", "options": "invalid"}',
        expectedStatus: 400
      }
    ];
    
    for (const test of errorTests) {
      try {
        const response = await fetch(`${this.serverUrl}/api/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: test.body,
        });
        
        if (response.status === test.expectedStatus) {
          this.log(`✅ ${test.name} - Correct error handling`, 'success');
        } else {
          this.log(`❌ ${test.name} - Expected ${test.expectedStatus}, got ${response.status}`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${test.name} - Network error: ${error.message}`, 'error');
      }
    }
  }

  async runAllTests() {
    console.log('🔧 FULL STACK DEBUG TESTING');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Server Health', fn: () => this.testServerHealth() },
      { name: 'Client Accessibility', fn: () => this.testClientAccessibility() },
      { name: 'Scan Endpoint', fn: () => this.testScanEndpoint() },
      { name: 'Concurrent Scans', fn: () => this.testConcurrentScans() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() }
    ];
    
    for (const test of tests) {
      console.log(`\n🧪 Running: ${test.name}`);
      console.log('-'.repeat(30));
      await test.fn();
    }
    
    console.log('\n🎯 DEBUG SUMMARY');
    console.log('=' .repeat(50));
    console.log('If all tests pass, the issue might be:');
    console.log('1. Client-side JavaScript error');
    console.log('2. Browser-specific issue');
    console.log('3. Race condition in the UI');
    console.log('4. Network timing issue');
    console.log('5. CORS configuration problem');
  }
}

const debugger = new FullStackDebugger();
debugger.runAllTests().catch(console.error);
