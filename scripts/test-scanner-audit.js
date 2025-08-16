import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testScannerFunctionality() {
  console.log('🔍 SCANNER FUNCTIONALITY AUDIT\n');
  
  const tests = [
    {
      name: 'Path-based Scanning',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/scan', {
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(`Scan failed: ${result.error}`);
        }
        
        console.log(`✅ Path scan completed: ${result.data.files?.length || 0} files`);
        return result.data;
      }
    },
    {
      name: 'Search Functionality',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/search?q=scanner&limit=10');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(`Search failed: ${result.error}`);
        }
        
        console.log(`✅ Search working: ${result.data?.total || 0} results`);
        return result.data;
      }
    },
    {
      name: 'Health Check',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/health?detailed=true');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const health = await response.json();
        if (health.status !== 'ok') {
          throw new Error(`Health check failed: ${health.status}`);
        }
        
        console.log('✅ Health check passed');
        return health;
      }
    },
    {
      name: 'Migration Status',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/migrations/status');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(`Migration status failed: ${result.error}`);
        }
        
        console.log(`✅ Migrations: ${result.data.applied}/${result.data.total} applied`);
        return result.data;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      await test.test();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All scanner functionality tests passed!');
  }
}

testScannerFunctionality().catch(console.error);
