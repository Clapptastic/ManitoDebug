import db from './database.js';

class MigrationService {
  constructor() {
    this.migrations = [
      {
        version: 1,
        name: 'Initial schema',
        up: async () => {
          await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
              version INTEGER UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              applied_at TIMESTAMP DEFAULT NOW()
            )
          `);
        }
      },
      {
        version: 2,
        name: 'Fix JSONB fields',
        up: async () => {
          // Ensure JSONB fields are properly typed
          await db.query(`
            ALTER TABLE projects 
            ALTER COLUMN settings TYPE JSONB USING 
              CASE 
                WHEN settings IS NULL THEN '{}'::jsonb
                WHEN settings::text = 'null' THEN '{}'::jsonb
                ELSE settings::jsonb
              END
          `);
          
          await db.query(`
            ALTER TABLE scans 
            ALTER COLUMN scan_options TYPE JSONB USING 
              CASE 
                WHEN scan_options IS NULL THEN '{}'::jsonb
                WHEN scan_options::text = 'null' THEN '{}'::jsonb
                ELSE scan_options::jsonb
              END
          `);
          
          await db.query(`
            ALTER TABLE scans 
            ALTER COLUMN results TYPE JSONB USING 
              CASE 
                WHEN results IS NULL THEN '{}'::jsonb
                WHEN results::text = 'null' THEN '{}'::jsonb
                ELSE results::jsonb
              END
          `);
        }
      }
    ];
  }

  async getCurrentVersion() {
    try {
      const result = await db.query('SELECT MAX(version) as current_version FROM migrations');
      return result.rows[0]?.current_version || 0;
    } catch (error) {
      // Table doesn't exist, start from version 0
      return 0;
    }
  }

  async runMigrations() {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('Database is up to date');
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);
    
    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        await migration.up();
        
        await db.query(
          'INSERT INTO migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name]
        );
        
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully');
  }
}

export default new MigrationService();
