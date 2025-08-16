import enhancedDb from './enhancedDatabase.js';
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

// Circuit Breaker for Migration Operations
class MigrationCircuitBreaker {
  constructor(failureThreshold = 3, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN state');
      } else {
        throw new Error('Migration circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error('Migration circuit breaker opened due to repeated failures', {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }
}

// Migration functions with enhanced error handling and rollback
const migrations = [
  {
    id: '001_initial_schema',
    description: 'Create initial database schema',
    checksum: 'a1b2c3d4e5f6', // Add checksum for verification
    up: async () => {
      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.projects (
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

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.scans (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES manito_dev.projects(id) ON DELETE CASCADE,
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

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.files (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES manito_dev.projects(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          content TEXT,
          lines INTEGER DEFAULT 0,
          size INTEGER DEFAULT 0,
          complexity INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.dependencies (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES manito_dev.projects(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          version VARCHAR(100),
          type VARCHAR(50),
          source VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.conflicts (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES manito_dev.projects(id) ON DELETE CASCADE,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          severity VARCHAR(20) DEFAULT 'medium',
          file_path TEXT,
          line_number INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.cache (
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
    checksum: 'b2c3d4e5f6g7',
    up: async () => {
      // Create search_logs table
      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.search_logs (
          id SERIAL PRIMARY KEY,
          query TEXT NOT NULL,
          user_id INTEGER REFERENCES manito_dev.users(id) ON DELETE SET NULL,
          entity_type VARCHAR(50),
          result_count INTEGER DEFAULT 0,
          rank FLOAT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for search_logs
      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_query ON manito_dev.search_logs USING GIN(to_tsvector('english', query))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON manito_dev.search_logs(user_id)
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON manito_dev.search_logs(created_at)
      `);

      // Add full-text search indexes to existing tables
      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_name_fts ON manito_dev.projects USING GIN(to_tsvector('english', name))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_description_fts ON manito_dev.projects USING GIN(to_tsvector('english', COALESCE(description, '')))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_path_fts ON manito_dev.projects USING GIN(to_tsvector('english', path))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_search_composite ON manito_dev.projects USING GIN(
          to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || path)
        )
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_scans_results_fts ON manito_dev.scans USING GIN(to_tsvector('english', results::text))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_scans_metadata_fts ON manito_dev.scans USING GIN(to_tsvector('english', metadata::text))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_files_content_fts ON manito_dev.files USING GIN(to_tsvector('english', content))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_files_path_fts ON manito_dev.files USING GIN(to_tsvector('english', file_path))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_dependencies_name_fts ON manito_dev.dependencies USING GIN(to_tsvector('english', name))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_dependencies_type_fts ON manito_dev.dependencies USING GIN(to_tsvector('english', type))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_conflicts_description_fts ON manito_dev.conflicts USING GIN(to_tsvector('english', description))
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_conflicts_type_fts ON manito_dev.conflicts USING GIN(to_tsvector('english', type))
      `);

      // Create search functions
      await enhancedDb.query(`
        CREATE OR REPLACE FUNCTION manito_dev.calculate_text_similarity(text1 text, text2 text)
        RETURNS float AS $$
        BEGIN
          RETURN similarity(text1, text2);
        END;
        $$ LANGUAGE plpgsql
      `);

      await enhancedDb.query(`
        CREATE OR REPLACE FUNCTION manito_dev.search_projects(search_query text, user_id integer DEFAULT NULL)
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
          FROM manito_dev.projects p
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
        CREATE OR REPLACE FUNCTION manito_dev.global_search(
          search_query text, 
          user_id integer DEFAULT NULL, 
          limit_count integer DEFAULT 50
        ) RETURNS TABLE(
          entity_type text,
          entity_id integer,
          title text,
          description text,
          metadata jsonb,
          rank float,
          match_type text
        ) AS $$
        BEGIN
          -- Search projects
          RETURN QUERY
          SELECT 
            'project'::text as entity_type,
            p.id::integer as entity_id,
            p.name as title,
            COALESCE(p.description, '') as description,
            jsonb_build_object(
              'path', p.path,
              'scan_status', p.scan_status,
              'last_scanned_at', p.last_scanned_at,
              'created_at', p.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            CASE 
              WHEN p.name ILIKE '%' || search_query || '%' THEN 'exact_name'
              WHEN p.path ILIKE '%' || search_query || '%' THEN 'exact_path'
              WHEN p.description ILIKE '%' || search_query || '%' THEN 'exact_description'
              ELSE 'semantic'
            END as match_type
          FROM manito_dev.projects p
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND (
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path) @@ plainto_tsquery('english', search_query)
              OR p.name ILIKE '%' || search_query || '%'
              OR p.path ILIKE '%' || search_query || '%'
              OR COALESCE(p.description, '') ILIKE '%' || search_query || '%'
            )
          
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
              'conflicts_found', s.conflicts_found,
              'created_at', s.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', COALESCE(s.results::text, '') || ' ' || COALESCE(s.metadata::text, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.scans s
          JOIN manito_dev.projects p ON s.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', COALESCE(s.results::text, '') || ' ' || COALESCE(s.metadata::text, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search files
          SELECT 
            'file'::text as entity_type,
            f.id::integer as entity_id,
            f.file_path as title,
            'Lines: ' || f.lines || ', Size: ' || f.size || ' bytes, Complexity: ' || f.complexity as description,
            jsonb_build_object(
              'project_id', f.project_id,
              'lines', f.lines,
              'size', f.size,
              'complexity', f.complexity,
              'created_at', f.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', COALESCE(f.content, '') || ' ' || f.file_path),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.files f
          JOIN manito_dev.projects p ON f.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', COALESCE(f.content, '') || ' ' || f.file_path) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search dependencies
          SELECT 
            'dependency'::text as entity_type,
            d.id::integer as entity_id,
            d.name || ' (' || COALESCE(d.version, 'unknown') || ')' as title,
            'Type: ' || d.type || ', Source: ' || COALESCE(d.source, 'unknown') as description,
            jsonb_build_object(
              'project_id', d.project_id,
              'version', d.version,
              'type', d.type,
              'source', d.source,
              'created_at', d.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.dependencies d
          JOIN manito_dev.projects p ON d.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search conflicts
          SELECT 
            'conflict'::text as entity_type,
            c.id::integer as entity_id,
            c.type || ' in ' || COALESCE(c.file_path, 'unknown file') as title,
            COALESCE(c.description, 'No description available') as description,
            jsonb_build_object(
              'project_id', c.project_id,
              'severity', c.severity,
              'file_path', c.file_path,
              'line_number', c.line_number,
              'created_at', c.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', c.type || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.file_path, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.conflicts c
          JOIN manito_dev.projects p ON c.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', c.type || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.file_path, '')) @@ plainto_tsquery('english', search_query)
          
          ORDER BY rank DESC, entity_type, entity_id
          LIMIT limit_count;
        END;
        $$ LANGUAGE plpgsql
      `;
      
      await enhancedDb.query(globalSearchFunction);
    }
  },
  {
    id: '003_websocket_enhancements',
    description: 'Add WebSocket connection tracking',
    checksum: 'c3d4e5f6g7h8',
    up: async () => {
      await enhancedDb.query(`
        CREATE TABLE IF NOT EXISTS manito_dev.websocket_connections (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES manito_dev.users(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          disconnected_at TIMESTAMP,
          last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subscriptions JSONB DEFAULT '[]'::jsonb
        )
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_websocket_connections_user_id ON manito_dev.websocket_connections(user_id)
      `);

      await enhancedDb.query(`
        CREATE INDEX IF NOT EXISTS idx_websocket_connections_connected_at ON manito_dev.websocket_connections(connected_at)
      `);
    }
  },
  {
    id: '004_fix_global_search',
    description: 'Fix global search function with proper column references',
    checksum: 'd4e5f6g7h8i9',
    up: async () => {
      // Fix global search function with proper column references
      const fixedGlobalSearchFunction = `
        CREATE OR REPLACE FUNCTION manito_dev.global_search(
          search_query text, 
          user_id integer DEFAULT NULL, 
          limit_count integer DEFAULT 50
        ) RETURNS TABLE(
          entity_type text,
          entity_id integer,
          title text,
          description text,
          metadata jsonb,
          rank float,
          match_type text
        ) AS $$
        BEGIN
          -- Search projects
          RETURN QUERY
          SELECT 
            'project'::text as entity_type,
            p.id::integer as entity_id,
            p.name as title,
            COALESCE(p.description, '') as description,
            jsonb_build_object(
              'path', p.path,
              'scan_status', p.scan_status,
              'last_scanned_at', p.last_scanned_at,
              'created_at', p.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            CASE 
              WHEN p.name ILIKE '%' || search_query || '%' THEN 'exact_name'
              WHEN p.path ILIKE '%' || search_query || '%' THEN 'exact_path'
              WHEN p.description ILIKE '%' || search_query || '%' THEN 'exact_description'
              ELSE 'semantic'
            END as match_type
          FROM manito_dev.projects p
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND (
              to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || p.path) @@ plainto_tsquery('english', search_query)
              OR p.name ILIKE '%' || search_query || '%'
              OR p.path ILIKE '%' || search_query || '%'
              OR COALESCE(p.description, '') ILIKE '%' || search_query || '%'
            )
          
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
              'conflicts_found', s.conflicts_found,
              'created_at', s.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', COALESCE(s.results::text, '') || ' ' || COALESCE(s.metadata::text, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.scans s
          JOIN manito_dev.projects p ON s.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', COALESCE(s.results::text, '') || ' ' || COALESCE(s.metadata::text, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search files
          SELECT 
            'file'::text as entity_type,
            f.id::integer as entity_id,
            f.file_path as title,
            'Lines: ' || f.lines || ', Size: ' || f.size || ' bytes, Complexity: ' || f.complexity as description,
            jsonb_build_object(
              'project_id', f.project_id,
              'lines', f.lines,
              'size', f.size,
              'complexity', f.complexity,
              'created_at', f.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', COALESCE(f.content, '') || ' ' || f.file_path),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.files f
          JOIN manito_dev.projects p ON f.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', COALESCE(f.content, '') || ' ' || f.file_path) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search dependencies
          SELECT 
            'dependency'::text as entity_type,
            d.id::integer as entity_id,
            d.name || ' (' || COALESCE(d.version, 'unknown') || ')' as title,
            'Type: ' || d.type || ', Source: ' || COALESCE(d.source, 'unknown') as description,
            jsonb_build_object(
              'project_id', d.project_id,
              'version', d.version,
              'type', d.type,
              'source', d.source,
              'created_at', d.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.dependencies d
          JOIN manito_dev.projects p ON d.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')) @@ plainto_tsquery('english', search_query)
          
          UNION ALL
          
          -- Search conflicts
          SELECT 
            'conflict'::text as entity_type,
            c.id::integer as entity_id,
            c.type || ' in ' || COALESCE(c.file_path, 'unknown file') as title,
            COALESCE(c.description, 'No description available') as description,
            jsonb_build_object(
              'project_id', c.project_id,
              'severity', c.severity,
              'file_path', c.file_path,
              'line_number', c.line_number,
              'created_at', c.created_at
            ) as metadata,
            COALESCE(ts_rank(
              to_tsvector('english', c.type || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.file_path, '')),
              plainto_tsquery('english', search_query)
            ), 0.0) as rank,
            'semantic'::text as match_type
          FROM manito_dev.conflicts c
          JOIN manito_dev.projects p ON c.project_id = p.id
          WHERE 
            (user_id IS NULL OR p.user_id = user_id)
            AND to_tsvector('english', c.type || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.file_path, '')) @@ plainto_tsquery('english', search_query)
          
          ORDER BY rank DESC, entity_type, entity_id
          LIMIT limit_count;
        END;
        $$ LANGUAGE plpgsql
      `;
      
      await enhancedDb.query(fixedGlobalSearchFunction);
    }
  }
];

// Enhanced migration tracking table
const createMigrationsTable = async () => {
  await enhancedDb.query(`
    CREATE TABLE IF NOT EXISTS manito_dev.migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT,
      checksum VARCHAR(255),
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_ms INTEGER,
      status VARCHAR(50) DEFAULT 'success',
      error_message TEXT
    )
  `);
};

// Get applied migrations
const getAppliedMigrations = async () => {
  const result = await enhancedDb.query('SELECT id, checksum FROM manito_dev.migrations ORDER BY applied_at');
  return result.rows;
};

// Verify migration success
const verifyMigrationSuccess = async (migrationId, client) => {
  switch (migrationId) {
    case '001_initial_schema':
      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'manito_dev' 
        AND table_name IN ('projects', 'scans', 'files', 'dependencies', 'conflicts', 'users', 'cache')
      `);
      if (tables.rows.length < 7) {
        throw new Error(`Migration 001 failed: Expected 7 tables, found ${tables.rows.length}`);
      }
      break;
      
    case '002_semantic_search':
      const functions = await client.query(`
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'manito_dev' 
        AND routine_name IN ('global_search', 'search_projects', 'calculate_text_similarity')
      `);
      if (functions.rows.length < 3) {
        throw new Error(`Migration 002 failed: Expected 3 functions, found ${functions.rows.length}`);
      }
      
      // Verify indexes exist
      const indexes = await client.query(`
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'manito_dev' 
        AND indexname LIKE '%_fts'
      `);
      if (indexes.rows.length < 10) {
        throw new Error(`Migration 002 failed: Expected at least 10 FTS indexes, found ${indexes.rows.length}`);
      }
      break;
      
    case '003_websocket_enhancements':
      const wsTable = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'manito_dev' AND table_name = 'websocket_connections'
      `);
      if (wsTable.rows.length === 0) {
        throw new Error('Migration 003 failed: websocket_connections table not created');
      }
      break;
  }
};

// Enhanced apply migration with rollback and verification
const applyMigration = async (migration) => {
  const startTime = Date.now();
  let client = null;
  
  try {
    logger.info(`🚀 Starting migration: ${migration.id} - ${migration.description}`);
    
    // Get database client
    client = await enhancedDb.pool.connect();
    await client.query(`SET search_path TO manito_dev`);
    
    // Test connection before migration
    await client.query('SELECT 1 as test');
    logger.info(`✅ Database connection verified for migration: ${migration.id}`);
    
    // Execute migration with transaction
    await client.query('BEGIN');
    
    // Execute migration
    await migration.up();
    
    // Verify migration success by checking for expected objects
    await verifyMigrationSuccess(migration.id, client);
    
    // Record migration
    await client.query(
      'INSERT INTO manito_dev.migrations (id, description, checksum, duration_ms) VALUES ($1, $2, $3, $4)',
      [migration.id, migration.description, migration.checksum, Date.now() - startTime]
    );
    
    await client.query('COMMIT');
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Migration ${migration.id} completed successfully in ${duration}ms`);
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    const duration = Date.now() - startTime;
    logger.error(`❌ Migration ${migration.id} failed after ${duration}ms`, {
      error: error.message,
      stack: error.stack,
      code: error.code,
      migration: migration.id
    });
    
    // Record failed migration
    if (client) {
      try {
        await client.query(
          'INSERT INTO manito_dev.migrations (id, description, checksum, duration_ms, status, error_message) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET status = $5, error_message = $6',
          [migration.id, migration.description, migration.checksum, duration, 'failed', error.message]
        );
      } catch (recordError) {
        logger.error('Failed to record migration failure', { error: recordError.message });
      }
    }
    
    throw new Error(`Migration ${migration.id} failed: ${error.message}`);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Circuit breaker instance
const circuitBreaker = new MigrationCircuitBreaker();

// Enhanced run migrations with circuit breaker
const runMigrations = async () => {
  try {
    await createMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.find(applied => applied.id === migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return { success: true, message: 'No pending migrations' };
    }
    
    logger.info(`🚀 Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await circuitBreaker.execute(async () => {
        await applyMigration(migration);
      });
    }
    
    logger.info('🎉 All migrations completed successfully');
    return { success: true, message: 'All migrations completed successfully' };
  } catch (error) {
    logger.error('❌ Migration failed', { error: error.message });
    throw error;
  }
};

// Enhanced get migration status
const getMigrationStatus = async () => {
  try {
    await createMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    
    return {
      total: migrations.length,
      applied: appliedMigrations.length,
      pending: migrations.length - appliedMigrations.length,
      migrations: migrations.map(migration => {
        const applied = appliedMigrations.find(applied => applied.id === migration.id);
        return {
          ...migration,
          applied: !!applied,
          appliedAt: applied?.applied_at,
          status: applied ? 'success' : 'pending'
        };
      }),
      circuitBreaker: {
        state: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount
      }
    };
  } catch (error) {
    logger.error('Failed to get migration status', { error: error.message });
    throw error;
  }
};

export default {
  runMigrations,
  getMigrationStatus,
  migrations,
  circuitBreaker
};
