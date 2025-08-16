import enhancedDb from '../server/services/enhancedDatabase.js';

async function testSearch() {
  try {
    console.log('Testing search function...');
    
    // Test the global search function directly
    const result = await enhancedDb.query(
      'SELECT * FROM manito_dev.global_search($1, $2, $3)',
      ['test', null, 10],
      { skipSchema: true }
    );
    
    console.log('Search result:', result.rows);
    console.log('Success!');
  } catch (error) {
    console.error('Search error:', error.message);
    console.error('Full error:', error);
  }
}

testSearch().catch(console.error);
