import db from './database.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Migration functions
const migrations = [
  {
    id: '001_initial_schema',
    description: 'Create initial database schema',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          name VARCHAR(255) NOT NULL,
          path TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_scanned_at TIMESTAMP,
          scan_status VARCHAR(50) DEFAULT 'pending'
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS scans (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          files_scanned INTEGER DEFAULT 0,
          lines_of_code INTEGER DEFAULT 0,
          conflicts_found INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          results JSONB,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS files (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          content TEXT,
          lines INTEGER DEFAULT 0,
          size INTEGER DEFAULT 0,
          complexity INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS dependencies (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          version VARCHAR(100),
          type VARCHAR(50),
          source VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS conflicts (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          severity VARCHAR(20) DEFAULT 'medium',
          file_path TEXT,
          line_number INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS cache (
          cache_key VARCHAR(255) PRIMARY KEY,
          cache_value TEXT NOT NULL,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  },
  {
    id: '002_semantic_search',
    description: 'Add semantic search capabilities',
    up: async () => {
      // Create search_logs table
      await db.query(`
        CREATE TABLE IF NOT EXISTS search_logs (
          id SERIAL PRIMARY KEY,
          query TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          entity_type VARCHAR(50),
          result_count INTEGER DEFAULT 0,
          rank FLOAT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for search_logs
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING GIN(to_tsvector('english', query))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at)
      `);

      // Add full-text search indexes to existing tables
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_name_fts ON projects USING GIN(to_tsvector('english', name))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_description_fts ON projects USING GIN(to_tsvector('english', COALESCE(description, '')))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_path_fts ON projects USING GIN(to_tsvector('english', path))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_search_composite ON projects USING GIN(
          to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || path)
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_scans_results_fts ON scans USING GIN(to_tsvector('english', results::text))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_scans_metadata_fts ON scans USING GIN(to_tsvector('english', metadata::text))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_files_content_fts ON files USING GIN(to_tsvector('english', content))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_files_path_fts ON files USING GIN(to_tsvector('english', file_path))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_dependencies_name_fts ON dependencies USING GIN(to_tsvector('english', name))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_dependencies_type_fts ON dependencies USING GIN(to_tsvector('english', type))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_conflicts_description_fts ON conflicts USING GIN(to_tsvector('english', description))
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_conflicts_type_fts ON conflicts USING GIN(to_tsvector('english', type))
      `);

      // Create search functions
      await db.query(`
        CREATE OR REPLACE FUNCTION calculate_text_similarity(text1 text, text2 text)
        RETURNS float AS $$
        BEGIN
          RETURN similarity(text1, text2);
        END;
        $$ LANGUAGE plpgsql
      `);

      await db.query(`
        CREATE OR REPLACE FUNCTION search_projects(search_query text, user_id integer DEFAULT NULL)
        RETURNS TABLE(
          id integer,
          name text,
          path text,
          description text,
          created_at timestamp,
          updated_at timestamp,
          last_scanned_at timestamp,
          scan_status text,
          rank float,
          match_type text
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            p.id,
            p.name,
            p.path,
            p.description,
            p.created_at,
            p.updated_at,
            p.last_scanned_at,
            p.scan_status,
            ts_rank(
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path),
              plainto_tsquery('english', search_query)
            ) as rank,
            CASE 
              WHEN p.name ILIKE '%' || search_query || '%' THEN 'exact_name'
              WHEN p.path ILIKE '%' || search_query || '%' THEN 'exact_path'
              WHEN p.description ILIKE '%' || search_query || '%' THEN 'exact_description'
              ELSE 'semantic'
            END as match_type
          FROM projects p
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND (
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path) @@ plainto_tsquery('english', search_query)
              OR p.name ILIKE '%' || search_query || '%'
              OR p.path ILIKE '%' || search_query || '%'
              OR p.description ILIKE '%' || search_query || '%'
            )
          ORDER BY rank DESC, p.updated_at DESC;
        END;
        $$ LANGUAGE plpgsql
      `);

      // Create global search function
      const globalSearchFunction = `
        CREATE OR REPLACE FUNCTION global_search(search_query text, user_id integer DEFAULT NULL, limit_count integer DEFAULT 50)
        RETURNS TABLE(
          entity_type text,
          entity_id integer,
          title text,
          description text,
          metadata jsonb,
          rank float,
          match_type text
        ) AS $$
        BEGIN
          RETURN QUERY
          
          -- Search projects
          SELECT 
            'project'::text as entity_type,
            p.id::integer as entity_id,
            p.name as title,
            p.description,
            jsonb_build_object(
              'path', p.path,
              'scan_status', p.scan_status,
              'last_scanned_at', p.last_scanned_at
            ) as metadata,
            ts_rank(
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path),
              plainto_tsquery('english', search_query)
            ) as rank,
            'semantic'::text as match_type
          FROM projects p
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search scan results
          SELECT 
            'scan'::text as entity_type,
            s.id::integer as entity_id,
            'Scan of ' || p.name as title,
            'Files: ' || s.files_scanned || ', Lines: ' || s.lines_of_code || ', Conflicts: ' || s.conflicts_found as description,
            jsonb_build_object(
              'project_name', p.name,
              'project_id', p.id,
              'status', s.status,
              'files_scanned', s.files_scanned,
              'lines_of_code', s.lines_of_code,
              'conflicts_found', s.conflicts_found
            ) as metadata,
            ts_rank(
              to_tsvector('english', s.results::text || ' ' || COALESCE(s.metadata::text, '')),
              plainto_tsquery('english', search_query)
            ) as rank,
            'semantic'::text as match_type
          FROM scans s
          JOIN projects p ON s.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', s.results::text || ' ' || COALESCE(s.metadata::text, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search files
          SELECT 
            'file'::text as entity_type,
            f.id::integer as entity_id,
            f.file_path as title,
            'Lines: ' || f.lines || ', Size: ' || f.size || ' bytes' as description,
            jsonb_build_object(
              'project_id', f.project_id,
              'lines', f.lines,
              'size', f.size,
              'complexity', f.complexity
            ) as metadata,
            ts_rank(
              to_tsvector('english', f.content || ' ' || f.file_path),
              plainto_tsquery('english', search_query)
            ) as rank,
            'semantic'::text as match_type
          FROM files f
          JOIN projects p ON f.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', f.content || ' ' || f.file_path) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search dependencies
          SELECT 
            'dependency'::text as entity_type,
            d.id::integer as entity_id,
            d.name || ' (' || d.version || ')' as title,
            'Type: ' || d.type || ', Source: ' || d.source as description,
            jsonb_build_object(
              'project_id', d.project_id,
              'version', d.version,
              'type', d.type,
              'source', d.source
            ) as metadata,
            ts_rank(
              to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')),
              plainto_tsquery('english', search_query)
            ) as rank,
            'semantic'::text as match_type
          FROM dependencies d
          JOIN projects p ON d.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search conflicts
          SELECT 
            'conflict'::text as entity_type,
            c.id::integer as entity_id,
            c.type || ' in ' || c.file_path as title,
            c.description as description,
            jsonb_build_object(
              'project_id', c.project_id,
              'severity', c.severity,
              'file_path', c.file_path,
              'line_number', c.line_number
            ) as metadata,
            ts_rank(
              to_tsvector('english', c.type || ' ' || c.description || ' ' || COALESCE(c.file_path, '')),
              plainto_tsquery('english', search_query)
            ) as rank,
            'semantic'::text as match_type
          FROM conflicts c
          JOIN projects p ON c.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', c.type || ' ' || c.description || ' ' || COALESCE(c.file_path, '')) @@ plainto_tsquery('english', search_query)
          
          ORDER BY rank DESC
          LIMIT limit_count;
        END;
        $$ LANGUAGE plpgsql
      `;
      
      await db.query(globalSearchFunction);
    }
  },
  {
    id: '003_websocket_enhancements',
    description: 'Add WebSocket connection tracking',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS websocket_connections (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          disconnected_at TIMESTAMP,
          last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subscriptions JSONB DEFAULT '[]'::jsonb
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_websocket_connections_user_id ON websocket_connections(user_id)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_websocket_connections_connected_at ON websocket_connections(connected_at)
      `);
    }
  }
];

// Migration tracking table
const createMigrationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get applied migrations
const getAppliedMigrations = async () => {
  const result = await db.query('SELECT id FROM migrations ORDER BY applied_at');
  return result.rows.map(row => row.id);
};

// Apply migration
const applyMigration = async (migration) => {
  try {
    logger.info(`Applying migration: ${migration.id} - ${migration.description}`);
    await migration.up();
    
    await db.query(
      'INSERT INTO migrations (id, description) VALUES ($1, $2)',
      [migration.id, migration.description]
    );
    
    logger.info(`Migration ${migration.id} applied successfully`);
  } catch (error) {
    logger.error(`Failed to apply migration ${migration.id}`, { error: error.message });
    throw error;
  }
};

// Run all pending migrations
const runMigrations = async () => {
  try {
    await createMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    throw error;
  }
};

// Get migration status
const getMigrationStatus = async () => {
  try {
    await createMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    
    return {
      total: migrations.length,
      applied: appliedMigrations.length,
      pending: migrations.length - appliedMigrations.length,
      migrations: migrations.map(migration => ({
        ...migration,
        applied: appliedMigrations.includes(migration.id)
      }))
    };
  } catch (error) {
    logger.error('Failed to get migration status', { error: error.message });
    throw error;
  }
};

export default {
  runMigrations,
  getMigrationStatus,
  migrations
};
