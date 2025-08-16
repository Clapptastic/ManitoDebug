import { getPortConfig, validatePortConfig, isPortAvailable } from '../server/config/ports.js';

class PortConflictResolutionTester {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testConflictResolution() {
    this.log('Testing port conflict resolution...');
    
    // Test multiple environments to ensure conflicts are resolved
    const environments = ['development', 'testing', 'staging', 'production'];
    
    for (const environment of environments) {
      this.log(`Testing ${environment} environment...`);
      
      try {
        // Get port configuration
        const config = await getPortConfig(environment);
        
        // Validate the configuration
        const validation = validatePortConfig(config);
        
        if (validation.valid) {
          this.log(`${environment}: All conflicts resolved successfully`, 'success');
          this.log(`  Server: ${config.server}, Client: ${config.client}, WebSocket: ${config.websocket}`);
          
          // Verify no duplicate ports
          const ports = Object.values(config);
          const uniquePorts = new Set(ports);
          
          if (ports.length === uniquePorts.size) {
            this.log(`${environment}: No duplicate ports found`, 'success');
            this.testResults.push({
              environment,
              result: 'conflicts_resolved',
              success: true,
              config
            });
          } else {
            this.log(`${environment}: Duplicate ports found`, 'error');
            this.testResults.push({
              environment,
              result: 'duplicate_ports',
              success: false,
              config
            });
          }
        } else {
          this.log(`${environment}: Conflicts not resolved`, 'error');
          validation.issues.forEach(issue => this.log(`  - ${issue}`, 'error'));
          this.testResults.push({
            environment,
            result: 'conflicts_not_resolved',
            success: false,
            issues: validation.issues,
            config
          });
        }
      } catch (error) {
        this.log(`${environment}: Error - ${error.message}`, 'error');
        this.testResults.push({
          environment,
          result: 'error',
          success: false,
          error: error.message
        });
      }
    }
  }

  async testPortAvailability() {
    this.log('Testing that assigned ports are actually available...');
    
    const environments = ['development', 'testing', 'staging'];
    
    for (const environment of environments) {
      try {
        const config = await getPortConfig(environment);
        
        // Test each assigned port
        for (const [service, port] of Object.entries(config)) {
          if (service === 'database' || service === 'redis') {
            // Skip database and redis ports as they may be in use by actual services
            continue;
          }
          
          const isAvailable = await isPortAvailable(port);
          if (isAvailable) {
            this.log(`${environment} ${service} (${port}): Available`, 'success');
          } else {
            this.log(`${environment} ${service} (${port}): In use`, 'error');
            this.testResults.push({
              test: 'Port Availability',
              environment,
              service,
              port,
              result: 'port_in_use',
              success: false
            });
          }
        }
      } catch (error) {
        this.log(`${environment}: Error testing port availability - ${error.message}`, 'error');
      }
    }
  }

  async testMultipleConfigurations() {
    this.log('Testing multiple configuration requests to ensure consistency...');
    
    const configs = [];
    
    // Get multiple configurations
    for (let i = 0; i < 5; i++) {
      try {
        const config = await getPortConfig('development');
        configs.push(config);
        this.log(`Configuration ${i + 1}: Server=${config.server}, Client=${config.client}, WebSocket=${config.websocket}`);
      } catch (error) {
        this.log(`Configuration ${i + 1}: Error - ${error.message}`, 'error');
      }
    }
    
    // Check if all configurations are consistent
    if (configs.length > 1) {
      const firstConfig = configs[0];
      const isConsistent = configs.every(config => 
        config.server === firstConfig.server &&
        config.client === firstConfig.client &&
        config.websocket === firstConfig.websocket
      );
      
      if (isConsistent) {
        this.log('All configurations are consistent', 'success');
        this.testResults.push({
          test: 'Configuration Consistency',
          result: 'consistent',
          success: true
        });
      } else {
        this.log('Configurations are inconsistent', 'error');
        this.testResults.push({
          test: 'Configuration Consistency',
          result: 'inconsistent',
          success: false,
          configs
        });
      }
    }
  }

  async testConflictDetection() {
    this.log('Testing conflict detection with known conflicts...');
    
    // Create a configuration with known conflicts
    const conflictConfig = {
      server: 3000,
      client: 3000, // Conflict with server
      websocket: 3001,
      database: 5432,
      redis: 6379,
      monitoring: 9090
    };
    
    const validation = validatePortConfig(conflictConfig);
    
    if (!validation.valid && validation.issues.some(issue => issue.includes('Port conflict'))) {
      this.log('Conflict detection working correctly', 'success');
      this.testResults.push({
        test: 'Conflict Detection',
        result: 'conflicts_detected',
        success: true
      });
    } else {
      this.log('Conflict detection failed', 'error');
      this.testResults.push({
        test: 'Conflict Detection',
        result: 'conflicts_not_detected',
        success: false
      });
    }
  }

  printResults() {
    console.log('\n📊 PORT CONFLICT RESOLUTION TEST RESULTS');
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
        console.log(`${index + 1}. ${result.test || result.environment}: ${result.result}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.issues) {
          result.issues.forEach(issue => console.log(`   Issue: ${issue}`));
        }
      });
    }
    
    console.log('\n✅ PASSED TESTS:');
    this.testResults.filter(r => r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.test || result.environment}: ${result.result}`);
    });
    
    if (failedTests === 0) {
      console.log('\n🎉 ALL PORT CONFLICTS SUCCESSFULLY RESOLVED!');
      console.log('✅ Port management system is working correctly');
      console.log('✅ No port conflicts in local environment');
    } else {
      console.log('\n⚠️  Some port conflicts remain. Please check the issues above.');
    }
  }

  async runAllTests() {
    console.log('🔧 PORT CONFLICT RESOLUTION TESTING');
    console.log('=' .repeat(50));
    
    await this.testConflictResolution();
    await this.testPortAvailability();
    await this.testMultipleConfigurations();
    await this.testConflictDetection();
    
    this.printResults();
  }
}

const tester = new PortConflictResolutionTester();
tester.runAllTests().catch(console.error);
