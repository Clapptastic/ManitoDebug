#!/usr/bin/env node

import { exec } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UploadFunctionalityTester {
  constructor() {
    this.serverPort = 3000;
    this.clientPort = 5173;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testServerHealth() {
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

  async testPathScan() {
    try {
      this.log('Testing path-based scanning...');
      
      const testPath = './core';
      const response = await fetch(`http://localhost:${this.serverPort}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: testPath,
          options: {
            patterns: ['**/*.{js,jsx,ts,tsx}'],
            excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Path Scan: HTTP ${response.status} - ${errorText}`, 'error');
        return false;
      }

      const result = await response.json();
      if (result.success) {
        this.log(`Path Scan: Success - ${result.data.files?.length || 0} files scanned`, 'success');
        this.log(`  Files: ${result.data.files?.length || 0}`);
        this.log(`  Lines of Code: ${result.data.metrics?.linesOfCode || 0}`);
        this.log(`  Dependencies: ${result.data.dependencies?.length || 0}`);
        this.log(`  Conflicts: ${result.data.conflicts?.length || 0}`);
        return true;
      } else {
        this.log(`Path Scan: Failed - ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Path Scan: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async testFileUpload() {
    try {
      this.log('Testing file upload functionality...');
      
      // Create a test file for upload
      const testFileContent = `
// Test file for upload functionality
import React from 'react';

function TestComponent() {
  return <div>Hello World</div>;
}

export default TestComponent;
      `;
      
      const testFilePath = path.join(__dirname, 'test-upload.js');
      await fs.writeFile(testFilePath, testFileContent);

      // Create FormData for upload
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('projectFile', await fs.readFile(testFilePath), 'test-upload.js');
      formData.append('projectName', 'test-upload-project');
      formData.append('patterns', JSON.stringify(['**/*.{js,jsx,ts,tsx}']));
      formData.append('excludePatterns', JSON.stringify(['node_modules/**', 'dist/**', 'build/**']));

      const response = await fetch(`http://localhost:${this.serverPort}/api/upload`, {
        method: 'POST',
        body: formData
      });

      // Clean up test file
      await fs.unlink(testFilePath);

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`File Upload: HTTP ${response.status} - ${errorText}`, 'error');
        return false;
      }

      const result = await response.json();
      if (result.success) {
        this.log(`File Upload: Success - ${result.data.files?.length || 0} files processed`, 'success');
        return true;
      } else {
        this.log(`File Upload: Failed - ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`File Upload: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async testDirectoryUpload() {
    try {
      this.log('Testing directory upload functionality...');
      
      // Create test directory structure
      const testDir = path.join(__dirname, 'test-directory');
      await fs.mkdir(testDir, { recursive: true });
      
      const testFiles = [
        { name: 'index.js', content: 'export default function() { return "Hello"; }' },
        { name: 'utils.js', content: 'export const helper = () => "Helper";' },
        { name: 'components/Button.jsx', content: 'import React from "react"; export default function Button() { return <button>Click</button>; }' }
      ];

      for (const file of testFiles) {
        const filePath = path.join(testDir, file.name);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content);
      }

      const response = await fetch(`http://localhost:${this.serverPort}/api/upload-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: {
            name: 'test-directory-project',
            files: testFiles.map(file => ({
              path: file.name,
              content: file.content,
              size: file.content.length
            }))
          },
          projectName: 'test-directory-project',
          source: 'browser-directory'
        })
      });

      // Clean up test directory
      await fs.rm(testDir, { recursive: true, force: true });

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Directory Upload: HTTP ${response.status} - ${errorText}`, 'error');
        return false;
      }

      const result = await response.json();
      if (result.success) {
        this.log(`Directory Upload: Success - ${result.data.files?.length || 0} files processed`, 'success');
        return true;
      } else {
        this.log(`Directory Upload: Failed - ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Directory Upload: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async testClientAccessibility() {
    try {
      this.log('Testing client accessibility...');
      
      const response = await fetch(`http://localhost:${this.clientPort}`);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('<!DOCTYPE html>') && html.includes('React')) {
          this.log('Client: Accessible and React app loaded', 'success');
          return true;
        } else {
          this.log('Client: Accessible but React app not detected', 'error');
          return false;
        }
      } else {
        this.log(`Client: HTTP ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Client: Connection failed - ${error.message}`, 'error');
      return false;
    }
  }

  async testProgressUpdates() {
    try {
      this.log('Testing progress update endpoints...');
      
      // Test scan queue status
      const queueResponse = await fetch(`http://localhost:${this.serverPort}/api/scan/queue`);
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        this.log(`Scan Queue: ${queueData.data.queueLength} queued, ${queueData.data.runningJobs} running`, 'success');
      } else {
        this.log(`Scan Queue: HTTP ${queueResponse.status}`, 'error');
      }

      // Test metrics endpoint
      const metricsResponse = await fetch(`http://localhost:${this.serverPort}/api/metrics`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        this.log(`Metrics: Server uptime ${metricsData.server.uptime.toFixed(1)}s`, 'success');
        this.log(`  WebSocket: ${metricsData.websocket.status} (${metricsData.websocket.connections} connections)`, 'success');
        this.log(`  Scan Queue: ${metricsData.scanQueue.queueLength} queued, ${metricsData.scanQueue.runningJobs} running`, 'success');
        return true;
      } else {
        this.log(`Metrics: HTTP ${metricsResponse.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Progress Updates: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async testUIComponentPreparation() {
    try {
      this.log('Testing UI component preparation...');
      
      // Test that the scan endpoint returns data in the format expected by UI components
      const response = await fetch(`http://localhost:${this.serverPort}/api/scan`, {
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
      });

      if (!response.ok) {
        this.log(`UI Preparation: HTTP ${response.status}`, 'error');
        return false;
      }

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        
        // Check for required UI component data
        const requiredFields = ['files', 'dependencies', 'conflicts', 'metrics'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length === 0) {
          this.log('UI Preparation: All required data fields present', 'success');
          this.log(`  Files: ${data.files?.length || 0}`);
          this.log(`  Dependencies: ${Object.keys(data.dependencies || {}).length}`);
          this.log(`  Conflicts: ${data.conflicts?.length || 0}`);
          this.log(`  Metrics: ${JSON.stringify(data.metrics)}`);
          return true;
        } else {
          this.log(`UI Preparation: Missing fields - ${missingFields.join(', ')}`, 'error');
          return false;
        }
      } else {
        this.log(`UI Preparation: Invalid response format`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`UI Preparation: Error - ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 TESTING UPLOAD, PATH, AND BROWSE FUNCTIONALITY');
    console.log('=' .repeat(60));
    
    const tests = [
      { name: 'Server Health', test: () => this.testServerHealth() },
      { name: 'Path Scan', test: () => this.testPathScan() },
      { name: 'File Upload', test: () => this.testFileUpload() },
      { name: 'Directory Upload', test: () => this.testDirectoryUpload() },
      { name: 'Client Accessibility', test: () => this.testClientAccessibility() },
      { name: 'Progress Updates', test: () => this.testProgressUpdates() },
      { name: 'UI Component Preparation', test: () => this.testUIComponentPreparation() }
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

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const successRate = ((passed / results.length) * 100).toFixed(1);
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.name}${result.error ? `: ${result.error}` : ''}`);
      });
    }
    
    if (passed === results.length) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Upload, path, and browse functionality is working correctly');
      console.log('✅ UI components will receive proper data for analysis');
      console.log('✅ Progress updates are available');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the issues above.');
    }
    
    return results;
  }
}

// Run the tests
const tester = new UploadFunctionalityTester();
tester.runAllTests().catch(console.error);
