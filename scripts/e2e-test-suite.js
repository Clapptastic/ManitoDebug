import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class E2ETestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.clientUrl = 'http://localhost:5173';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🧪';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(name, testFunction) {
    try {
      this.log(`Running: ${name}`);
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed' });
      this.log(`${name} - PASSED`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
      this.log(`${name} - FAILED: ${error.message}`, 'error');
    }
  }

  async testServerHealth() {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const health = await response.json();
    if (health.status !== 'ok') {
      throw new Error(`Server not healthy: ${health.status}`);
    }
  }

  async testClientAccessibility() {
    const response = await fetch(this.clientUrl);
    if (!response.ok) {
      throw new Error(`Client not accessible: ${response.status}`);
    }
    const html = await response.text();
    if (!html.includes('ManitoDebug')) {
      throw new Error('Client HTML does not contain expected content');
    }
  }

  async testDatabaseConnection() {
    const response = await fetch(`${this.baseUrl}/api/health?detailed=true`);
    if (!response.ok) {
      throw new Error(`Detailed health check failed: ${response.status}`);
    }
    const health = await response.json();
    if (!health.services?.database?.connected) {
      throw new Error('Database not connected');
    }
  }

  async testMigrationStatus() {
    const response = await fetch(`${this.baseUrl}/api/migrations/status`);
    if (!response.ok) {
      throw new Error(`Migration status failed: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(`Migration status error: ${result.error}`);
    }
    if (result.data.pending > 0) {
      throw new Error(`${result.data.pending} pending migrations`);
    }
  }

  async testPathBasedScanning() {
    const response = await fetch(`${this.baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: './core',
        options: {
          patterns: ['**/*.{js,jsx,ts,tsx}'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Path scan failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Path scan error: ${result.error}`);
    }

    if (!result.data.files || result.data.files.length === 0) {
      throw new Error('No files found in scan');
    }
  }

  async testSearchFunctionality() {
    const response = await fetch(`${this.baseUrl}/api/search?q=scanner&limit=10`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Search error: ${result.error}`);
    }
  }

  async testFileUpload() {
    // Create a test ZIP file
    const testDir = path.join(__dirname, 'test-upload');
    await fs.mkdir(testDir, { recursive: true });
    
    // Create a simple test file
    const testFile = path.join(testDir, 'test.js');
    await fs.writeFile(testFile, 'console.log("Hello World");');
    
    // Create ZIP file
    const { execSync } = await import('child_process');
    const zipPath = path.join(__dirname, 'test-upload.zip');
    execSync(`cd "${testDir}" && zip -r "${zipPath}" .`);
    
    // Test upload
    const formData = new FormData();
    const fileBuffer = await fs.readFile(zipPath);
    const blob = new Blob([fileBuffer]);
    formData.append('projectFile', blob, 'test-upload.zip');
    formData.append('projectName', 'E2ETestProject');

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Upload error: ${result.error}`);
    }

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.unlink(zipPath).catch(() => {});
  }

  async testWebSocketConnection() {
    // Test WebSocket health endpoint
    const response = await fetch(`${this.baseUrl}/api/health?detailed=true`);
    if (!response.ok) {
      throw new Error(`WebSocket health check failed: ${response.status}`);
    }
    
    const health = await response.json();
    if (!health.services?.websocket?.status || health.services.websocket.status !== 'healthy') {
      throw new Error('WebSocket service not healthy');
    }
  }

  async testAIEndpoints() {
    const response = await fetch(`${this.baseUrl}/api/ai/providers`);
    if (!response.ok) {
      throw new Error(`AI providers endpoint failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`AI providers error: ${result.error}`);
    }
  }

  async testProjectEndpoints() {
    const response = await fetch(`${this.baseUrl}/api/projects`);
    if (!response.ok) {
      throw new Error(`Projects endpoint failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Projects error: ${result.error}`);
    }
  }

  async testScanQueue() {
    const response = await fetch(`${this.baseUrl}/api/scan/queue`);
    if (!response.ok) {
      throw new Error(`Scan queue endpoint failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Scan queue error: ${result.error}`);
    }
  }

  async testMetrics() {
    const response = await fetch(`${this.baseUrl}/api/metrics`);
    if (!response.ok) {
      throw new Error(`Metrics endpoint failed: ${response.status}`);
    }

    const result = await response.json();
    // Metrics endpoint returns data directly, not wrapped in success property
    if (!result.server || !result.websocket || !result.scanQueue) {
      throw new Error('Metrics response missing expected properties');
    }
  }

  async runAllTests() {
    console.log('🚀 STARTING END-TO-END TEST SUITE\n');

    const tests = [
      { name: 'Server Health Check', fn: () => this.testServerHealth() },
      { name: 'Client Accessibility', fn: () => this.testClientAccessibility() },
      { name: 'Database Connection', fn: () => this.testDatabaseConnection() },
      { name: 'Migration Status', fn: () => this.testMigrationStatus() },
      { name: 'Path-based Scanning', fn: () => this.testPathBasedScanning() },
      { name: 'Search Functionality', fn: () => this.testSearchFunctionality() },
      { name: 'File Upload', fn: () => this.testFileUpload() },
      { name: 'WebSocket Connection', fn: () => this.testWebSocketConnection() },
      { name: 'AI Endpoints', fn: () => this.testAIEndpoints() },
      { name: 'Project Endpoints', fn: () => this.testProjectEndpoints() },
      { name: 'Scan Queue', fn: () => this.testScanQueue() },
      { name: 'Metrics Endpoints', fn: () => this.testMetrics() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
      console.log(''); // Add spacing between tests
    }

    this.printResults();
  }

  printResults() {
    console.log('\n📊 END-TO-END TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Full stack is operational.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  }
}

// Run the test suite
const testSuite = new E2ETestSuite();
testSuite.runAllTests().catch(console.error);
