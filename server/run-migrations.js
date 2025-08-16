import migrations from './services/migrations.js';

async function runMigrations() {
  try {
    console.log('Running database migrations with enhanced database service...');
    await migrations.runMigrations();
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
