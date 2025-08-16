import { getPortConfig, validatePortConfig, isPortAvailable, findAvailablePort, getEnvironmentPorts } from '../server/config/ports.js';

class PortManagementTester {
  constructor() {
    this.testResults = [];
    this.currentPorts = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testPortAvailability() {
    this.log('Testing port availability detection...');
    
    const testPorts = [3000, 3001, 3002, 3003, 3004, 3005, 5173, 8080];
    
    for (const port of testPorts) {
      try {
        const available = await isPortAvailable(port);
        this.log(`Port ${port}: ${available ? 'Available' : 'In Use'}`, available ? 'success' : 'info');
        this.testResults.push({
          test: 'Port Availability',
          port,
          result: available ? 'available' : 'in_use',
          success: true
        });
      } catch (error) {
        this.log(`Port ${port}: Error - ${error.message}`, 'error');
        this.testResults.push({
          test: 'Port Availability',
          port,
          result: 'error',
          success: false,
          error: error.message
        });
      }
    }
  }

  async testPortFinding() {
    this.log('Testing port finding functionality...');
    
    const ranges = [
      { min: 3000, max: 3010, description: 'Development range' },
      { min: 4000, max: 4010, description: 'Testing range' },
      { min: 5000, max: 5010, description: 'Staging range' }
    ];
    
    for (const range of ranges) {
      try {
        const port = await findAvailablePort(range.min, range.max);
        if (port) {
          this.log(`Found available port ${port} in range ${range.min}-${range.max} (${range.description})`, 'success');
          this.testResults.push({
            test: 'Port Finding',
            range: `${range.min}-${range.max}`,
            result: `found_port_${port}`,
            success: true
          });
        } else {
          this.log(`No available port found in range ${range.min}-${range.max}`, 'error');
          this.testResults.push({
            test: 'Port Finding',
            range: `${range.min}-${range.max}`,
            result: 'no_port_found',
            success: false
          });
        }
      } catch (error) {
        this.log(`Error finding port in range ${range.min}-${range.max}: ${error.message}`, 'error');
        this.testResults.push({
          test: 'Port Finding',
          range: `${range.min}-${range.max}`,
          result: 'error',
          success: false,
          error: error.message
        });
      }
    }
  }

  async testPortConfiguration() {
    this.log('Testing port configuration generation...');
    
    const environments = ['development', 'testing', 'staging', 'production'];
    
    for (const environment of environments) {
      try {
        const config = await getPortConfig(environment);
        const validation = validatePortConfig(config);
        
        if (validation.valid) {
          this.log(`Port config for ${environment}: Valid`, 'success');
          this.log(`  Server: ${config.server}, Client: ${config.client}, WebSocket: ${config.websocket}`);
          
          // Store current ports for later testing
          if (environment === 'development') {
            this.currentPorts = config;
          }
          
          this.testResults.push({
            test: 'Port Configuration',
            environment,
            result: 'valid',
            success: true,
            config
          });
        } else {
          this.log(`Port config for ${environment}: Invalid`, 'error');
          validation.issues.forEach(issue => this.log(`  - ${issue}`, 'error'));
          this.testResults.push({
            test: 'Port Configuration',
            environment,
            result: 'invalid',
            success: false,
            issues: validation.issues
          });
        }
      } catch (error) {
        this.log(`Error generating port config for ${environment}: ${error.message}`, 'error');
        this.testResults.push({
          test: 'Port Configuration',
          environment,
          result: 'error',
          success: false,
          error: error.message
        });
      }
    }
  }

  testEnvironmentPorts() {
    this.log('Testing environment-specific port configurations...');
    
    const envPorts = getEnvironmentPorts();
    const environments = Object.keys(envPorts);
    
    for (const environment of environments) {
      const ports = envPorts[environment];
      const hasAllServices = ports.server && ports.client && ports.websocket;
      
      if (hasAllServices) {
        this.log(`Environment ${environment}: Complete configuration`, 'success');
        this.log(`  Server: ${ports.server}, Client: ${ports.client}, WebSocket: ${ports.websocket}`);
        
        this.testResults.push({
          test: 'Environment Ports',
          environment,
          result: 'complete',
          success: true,
          ports
        });
      } else {
        this.log(`Environment ${environment}: Incomplete configuration`, 'error');
        this.testResults.push({
          test: 'Environment Ports',
          environment,
          result: 'incomplete',
          success: false,
          ports
        });
      }
    }
  }

  async testServerPortAssignment() {
    this.log('Testing server port assignment...');
    
    // Use the actual server port that's running
    const actualServerPort = 3004;
    
    try {
      const response = await fetch(`http://localhost:${actualServerPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        this.log(`Server on port ${actualServerPort}: Healthy`, 'success');
        this.log(`  Status: ${health.status}, Uptime: ${health.uptime}s`);
        
        this.testResults.push({
          test: 'Server Port Assignment',
          port: actualServerPort,
          result: 'healthy',
          success: true,
          health
        });
      } else {
        this.log(`Server on port ${actualServerPort}: Unhealthy (${response.status})`, 'error');
        this.testResults.push({
          test: 'Server Port Assignment',
          port: actualServerPort,
          result: 'unhealthy',
          success: false,
          status: response.status
        });
      }
    } catch (error) {
      this.log(`Server on port ${actualServerPort}: Connection failed - ${error.message}`, 'error');
      this.testResults.push({
        test: 'Server Port Assignment',
        port: actualServerPort,
        result: 'connection_failed',
        success: false,
        error: error.message
      });
    }
  }

  async testPortConflictResolution() {
    this.log('Testing port conflict resolution...');
    
    // Simulate a conflict by creating a config with duplicate ports
    const conflictConfig = {
      server: 3000,
      client: 3000, // Conflict with server
      websocket: 3001,
      database: 5432,
      redis: 6379,
      monitoring: 9090
    };
    
    try {
      const isValid = validatePortConfig(conflictConfig);
      if (!isValid) {
        this.log('Port conflict detection: Working (correctly identified conflict)', 'success');
        this.testResults.push({
          test: 'Port Conflict Resolution',
          result: 'conflict_detected',
          success: true
        });
      } else {
        this.log('Port conflict detection: Failed (did not identify conflict)', 'error');
        this.testResults.push({
          test: 'Port Conflict Resolution',
          result: 'conflict_not_detected',
          success: false
        });
      }
    } catch (error) {
      this.log(`Port conflict resolution error: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Port Conflict Resolution',
        result: 'error',
        success: false,
        error: error.message
      });
    }
  }

  printResults() {
    console.log('\n📊 PORT MANAGEMENT TEST RESULTS');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.test}: ${result.result}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });
    }
    
    console.log('\n✅ PASSED TESTS:');
    this.testResults.filter(r => r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.result}`);
    });
    
    console.log('\n🔧 CURRENT PORT CONFIGURATION:');
    if (this.currentPorts.server) {
      console.log(`Server: http://localhost:${this.currentPorts.server}`);
      console.log(`Client: http://localhost:${this.currentPorts.client || 5173}`);
      console.log(`WebSocket: ws://localhost:${this.currentPorts.websocket || 3001}`);
    }
  }

  async runAllTests() {
    console.log('🔧 PORT MANAGEMENT SYSTEM TESTING');
    console.log('=' .repeat(50));
    
    await this.testPortAvailability();
    await this.testPortFinding();
    await this.testPortConfiguration();
    this.testEnvironmentPorts();
    await this.testServerPortAssignment();
    await this.testPortConflictResolution();
    
    this.printResults();
  }
}

const tester = new PortManagementTester();
tester.runAllTests().catch(console.error);
