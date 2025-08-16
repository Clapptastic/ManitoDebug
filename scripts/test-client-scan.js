import fetch from 'node-fetch';

async function testClientScan() {
  console.log('🧪 Testing client scan request simulation...');
  
  // Simulate the exact client request
  const clientRequest = {
    path: '/Users/andrewclapp/Desktop/ai debug planning/manito-package/client/src',
    options: {
      patterns: ['**/*.{js,jsx,ts,tsx}'],
      excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
    }
  };
  
  console.log('📋 Client request:', JSON.stringify(clientRequest, null, 2));
  
  // Make multiple requests to test for intermittent issues
  for (let i = 1; i <= 5; i++) {
    console.log(`\n🔄 Test ${i}/5`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify(clientRequest),
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${duration}ms`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.success}`);
        if (result.data) {
          console.log(`Files found: ${result.data.files?.length || 0}`);
          console.log(`Scan time: ${result.data.scanTime}ms`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
        
        // Try to parse as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`Error details:`, errorJson);
        } catch (e) {
          console.log(`Raw error text: ${errorText}`);
        }
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      console.log(`Error stack: ${error.stack}`);
    }
    
    // Wait between requests
    if (i < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

testClientScan().catch(console.error);
