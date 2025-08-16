import fetch from 'node-fetch';

async function testScanError() {
  console.log('🧪 Testing scan endpoint for potential errors...');
  
  const testCases = [
    {
      name: 'Valid core path',
      path: './core',
      options: {
        patterns: ['**/*.{js,jsx,ts,tsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
      }
    },
    {
      name: 'Invalid path',
      path: './nonexistent',
      options: {
        patterns: ['**/*.{js,jsx,ts,tsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
      }
    },
    {
      name: 'Empty path',
      path: '',
      options: {
        patterns: ['**/*.{js,jsx,ts,tsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
      }
    },
    {
      name: 'Null path',
      path: null,
      options: {
        patterns: ['**/*.{js,jsx,ts,tsx}'],
        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`Path: ${testCase.path}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: testCase.path,
          options: testCase.options
        }),
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.success}`);
        if (result.data) {
          console.log(`Files found: ${result.data.files?.length || 0}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
}

testScanError().catch(console.error);
