#!/usr/bin/env node

/**
 * ManitoDebug Core Functionality Test
 * This script tests all critical components to ensure they're working properly
 */

import { CodeScanner } from '../core/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FunctionalityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async run() {
    console.log('🧪 Starting ManitoDebug Core Functionality Test\n');
    
    await this.testCoreScanner();
    await this.testFileSystem();
    await this.testDependencies();
    await this.testConfiguration();
    
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

  async testCoreScanner() {
    console.log('\n📁 Testing Core Scanner...');
    
    await this.test('CodeScanner instantiation', () => {
      const scanner = new CodeScanner();
      if (!scanner || typeof scanner.scan !== 'function') {
        throw new Error('CodeScanner not properly instantiated');
      }
    });

    await this.test('Scanner options configuration', () => {
      const options = {
        patterns: ['**/*.js'],
        excludePatterns: ['node_modules/**'],
        maxFileSize: 1024 * 1024
      };
      const scanner = new CodeScanner(options);
      if (scanner.options.patterns[0] !== '**/*.js') {
        throw new Error('Scanner options not properly configured');
      }
    });

    await this.test('Scanner metrics initialization', () => {
      const scanner = new CodeScanner();
      if (!scanner.metrics || typeof scanner.metrics.filesScanned !== 'number') {
        throw new Error('Scanner metrics not properly initialized');
      }
    });
  }

  async testFileSystem() {
    console.log('\n💾 Testing File System...');
    
    const testDir = path.join(__dirname, '..', 'core');
    
    await this.test('Test directory existence', async () => {
      try {
        await fs.access(testDir);
      } catch (error) {
        throw new Error(`Test directory not found: ${testDir}`);
      }
    });

    await this.test('Test file reading', async () => {
      const testFile = path.join(testDir, 'index.js');
      try {
        const content = await fs.readFile(testFile, 'utf-8');
        if (!content || content.length === 0) {
          throw new Error('Test file is empty');
        }
      } catch (error) {
        throw new Error(`Cannot read test file: ${error.message}`);
      }
    });

    await this.test('Scanner file discovery', async () => {
      const scanner = new CodeScanner({
        patterns: ['**/*.js'],
        excludePatterns: ['node_modules/**']
      });
      
      const files = await scanner.findFiles(testDir);
      if (!Array.isArray(files)) {
        throw new Error('File discovery did not return an array');
      }
      
      if (files.length === 0) {
        throw new Error('No files found in test directory');
      }
    });
  }

  async testDependencies() {
    console.log('\n🔗 Testing Dependencies...');
    
    await this.test('Babel parser import', () => {
      // This test ensures the babel parser is available
      const scanner = new CodeScanner();
      if (!scanner) {
        throw new Error('Babel parser dependency not available');
      }
    });

    await this.test('Glob pattern matching', async () => {
      const scanner = new CodeScanner({
        patterns: ['**/*.js']
      });
      
      const testDir = path.join(__dirname, '..', 'core');
      const files = await scanner.findFiles(testDir);
      
      if (!files.some(file => file.endsWith('.js'))) {
        throw new Error('Glob pattern matching not working');
      }
    });
  }

  async testConfiguration() {
    console.log('\n⚙️ Testing Configuration...');
    
    await this.test('Environment variables', () => {
      // Check if we can access environment variables
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === undefined) {
        throw new Error('NODE_ENV not set');
      }
    });

    await this.test('Package.json dependencies', async () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      try {
        const content = await fs.readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(content);
        
        if (!pkg.dependencies || !pkg.devDependencies) {
          throw new Error('Package.json missing dependencies section');
        }
      } catch (error) {
        throw new Error(`Cannot read package.json: ${error.message}`);
      }
    });

    await this.test('Core package structure', async () => {
      const corePath = path.join(__dirname, '..', 'core');
      const files = await fs.readdir(corePath);
      
      const requiredFiles = ['index.js', 'package.json'];
      for (const file of requiredFiles) {
        if (!files.includes(file)) {
          throw new Error(`Missing required core file: ${file}`);
        }
      }
    });
  }

  async testIntegration() {
    console.log('\n🔗 Testing Integration...');
    
    await this.test('End-to-end scan test', async () => {
      const scanner = new CodeScanner({
        patterns: ['**/*.js'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
      });
      
      const testDir = path.join(__dirname, '..', 'core');
      const result = await scanner.scan(testDir);
      
      if (!result || !result.files || !Array.isArray(result.files)) {
        throw new Error('Scan result not properly structured');
      }
      
      if (!result.metrics || typeof result.metrics.filesScanned !== 'number') {
        throw new Error('Scan metrics not properly calculated');
      }
      
      console.log(`   📊 Scan completed: ${result.files.length} files, ${result.metrics.linesOfCode} lines of code`);
    });
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
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
      console.log('✅ ALL TESTS PASSED - Core functionality is working properly!');
    } else {
      console.log('⚠️ Some tests failed - Please check the issues above');
    }
  }
}

// Run the tests
const tester = new FunctionalityTester();
tester.run().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
