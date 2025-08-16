# Implementation Plan: 100% Functional Database & Semantic Search

## 🎯 **GOAL**
Achieve 100% functional enhanced database service and semantic search using leading-edge technologies and best practices.

## 📋 **PHASE 1: FIX MIGRATION SYSTEM (CRITICAL)**

### **Step 1.1: Debug Migration System**
```javascript
// File: server/services/migrations.js
// Add comprehensive error handling and logging

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
      'INSERT INTO manito_dev.migrations (id, description) VALUES ($1, $2)',
      [migration.id, migration.description]
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
    
    throw new Error(`Migration ${migration.id} failed: ${error.message}`);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Add verification function
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
```

### **Step 1.2: Fix Schema Handling**
```javascript
// File: server/services/enhancedDatabase.js
// Improve schema handling in query method

async query(text, params = [], options = {}) {
  const {
    cacheKey = null,
    cacheTTL = 300,
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    skipSchema = false // New option for queries that don't need schema
  } = options;

  // Check cache first
  if (cacheKey && this.cache.has(cacheKey)) {
    const cached = this.cache.get(cacheKey);
    if (Date.now() < cached.expires) {
      this.cacheStats.hits++;
      return cached.data;
    } else {
      this.cache.delete(cacheKey);
    }
  }

  if (!this.connected) {
    return this.mockQuery(text, params);
  }
  
  const start = Date.now();
  let client = null;
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      client = await this.pool.connect();
      
      // Set schema unless explicitly skipped
      if (!skipSchema) {
        await client.query(`SET search_path TO ${this.schema}`);
      }
      
      // Set statement timeout
      await client.query(`SET statement_timeout = ${timeout}`);
      
      const res = await client.query(text, params);
      
      const duration = Date.now() - start;
      this.logger.debug('Executed query', { 
        duration: `${duration}ms`,
        rows: res.rows.length,
        command: res.command,
        attempt: attempt + 1,
        schema: skipSchema ? 'none' : this.schema
      });
      
      // Cache the result if cacheKey is provided
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data: res,
          expires: Date.now() + (cacheTTL * 1000)
        });
        this.cacheStats.sets++;
      }
      
      return res;
    } catch (error) {
      attempt++;
      const duration = Date.now() - start;
      
      this.logger.error('Query error', { 
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
        attempt,
        query: text.substring(0, 100) + '...',
        params: params.length,
        schema: skipSchema ? 'none' : this.schema
      });
      
      // Handle specific database errors
      if (error.code === '23505') {
        throw new Error('Duplicate entry found');
      } else if (error.code === '23503') {
        throw new Error('Referenced record not found');
      } else if (error.code === '42P01') {
        throw new Error('Database table not found - please run initialization');
      } else if (error.code === '57014') {
        throw new Error('Query timeout - operation took too long');
      }
      
      // Retry logic for transient errors
      if (attempt < retries && this.isRetryableError(error)) {
        this.logger.warn(`Retrying query (attempt ${attempt}/${retries})`, { 
          error: error.message 
        });
        await this.delay(retryDelay * attempt);
        continue;
      }
      
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}
```

### **Step 1.3: Add Migration Status Endpoint**
```javascript
// File: server/app.js
// Add migration status endpoint

app.get('/api/migrations/status', async (req, res) => {
  try {
    const status = await migrations.getMigrationStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Migration status check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get migration status',
      message: error.message
    });
  }
});

app.post('/api/migrations/run', async (req, res) => {
  try {
    await migrations.runMigrations();
    res.json({
      success: true,
      message: 'Migrations completed successfully'
    });
  } catch (error) {
    logger.error('Migration execution failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});
```

## 📋 **PHASE 2: ENHANCE DATABASE SERVICE**

### **Step 2.1: Improve Health Monitoring**
```javascript
// File: server/services/enhancedDatabase.js
// Add comprehensive health check

async health() {
  const health = {
    connected: false,
    pool: {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    },
    cache: {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      sets: this.cacheStats.sets,
      deletes: this.cacheStats.deletes,
      hitRate: this.cacheStats.hits + this.cacheStats.misses > 0 
        ? `${Math.round((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100)}%`
        : '0%',
      size: this.cache.size
    },
    serverTime: null,
    version: null,
    mockMode: false,
    tables: [],
    functions: [],
    indexes: []
  };

  try {
    const client = await this.pool.connect();
    
    // Test basic connection
    const basicTest = await client.query('SELECT NOW() as current_time, version() as version');
    health.serverTime = basicTest.rows[0].current_time;
    health.version = basicTest.rows[0].version;
    health.connected = true;
    
    // Get pool statistics
    health.pool = {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
    
    // Check schema and objects
    await client.query(`SET search_path TO ${this.schema}`);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `, [this.schema]);
    health.tables = tables.rows.map(row => row.table_name);
    
    // Check functions
    const functions = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = $1
      ORDER BY routine_name
    `, [this.schema]);
    health.functions = functions.rows.map(row => row.routine_name);
    
    // Check indexes
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = $1
      ORDER BY indexname
    `, [this.schema]);
    health.indexes = indexes.rows.map(row => row.indexname);
    
    client.release();
    
    return health;
  } catch (error) {
    this.logger.error('Health check failed', { error: error.message });
    health.error = error.message;
    health.mockMode = true;
    return health;
  }
}
```

### **Step 2.2: Add Connection Pool Monitoring**
```javascript
// File: server/services/enhancedDatabase.js
// Add pool event monitoring

constructor() {
  super();
  this.pool = null;
  this.connected = false;
  this.mockData = new Map();
  this.nextId = 1;
  this.cache = new Map();
  this.cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  this.poolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingConnections: 0,
    connectionErrors: 0,
    lastError: null
  };
  
  this.logger = winston.createLogger({
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

  this.initialize();
}

// Enhanced pool event handling
this.pool.on('error', (err, client) => {
  this.poolStats.connectionErrors++;
  this.poolStats.lastError = err.message;
  this.logger.error('Unexpected error on idle client', { 
    error: err.message,
    code: err.code,
    stack: err.stack 
  });
  this.emit('poolError', err);
});

this.pool.on('connect', (client) => {
  this.poolStats.totalConnections++;
  this.logger.debug('New client connected to pool');
  this.emit('clientConnected', client);
});

this.pool.on('remove', (client) => {
  this.poolStats.totalConnections--;
  this.logger.debug('Client removed from pool');
  this.emit('clientRemoved', client);
});

// Add pool monitoring method
async getPoolStats() {
  if (this.pool) {
    this.poolStats.activeConnections = this.pool.totalCount - this.pool.idleCount;
    this.poolStats.idleConnections = this.pool.idleCount;
    this.poolStats.waitingConnections = this.pool.waitingCount;
  }
  return this.poolStats;
}
```

## 📋 **PHASE 3: FIX SEMANTIC SEARCH**

### **Step 3.1: Create Robust Search Functions**
```sql
-- File: server/services/migrations.js
-- Update the global_search function creation

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
$$ LANGUAGE plpgsql;
`;
```

### **Step 3.2: Enhance Semantic Search Service**
```javascript
// File: server/services/semanticSearch.js
// Add comprehensive error handling and validation

async globalSearch(query, userId = null, limit = 50) {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }
    
    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 1000)) {
      throw new Error('Limit must be a number between 1 and 1000');
    }
    
    if (userId && (typeof userId !== 'number' || userId < 1)) {
      throw new Error('User ID must be a positive number');
    }
    
    // Clean and prepare query
    const cleanQuery = query.trim().toLowerCase();
    
    this.logger.info('Starting global search', { 
      query: cleanQuery, 
      userId, 
      limit,
      timestamp: new Date().toISOString()
    });
    
    // Execute search
    const result = await enhancedDb.query(
      'SELECT * FROM manito_dev.global_search($1, $2, $3)',
      [cleanQuery, userId, limit],
      {
        cacheKey: `global_search_${cleanQuery}_${userId}_${limit}`,
        cacheTTL: 300,
        timeout: 30000
      }
    );
    
    // Group results by entity type
    const groupedResults = {};
    result.rows.forEach(row => {
      if (!groupedResults[row.entity_type]) {
        groupedResults[row.entity_type] = [];
      }
      groupedResults[row.entity_type].push(row);
    });
    
    // Log search analytics
    await this.logSearch({
      query: cleanQuery,
      userId,
      resultCount: result.rows.length,
      duration: Date.now() - startTime,
      entityTypes: Object.keys(groupedResults)
    });
    
    const duration = Date.now() - startTime;
    this.logger.info('Global search completed', { 
      query: cleanQuery,
      resultCount: result.rows.length,
      duration: `${duration}ms`,
      entityTypes: Object.keys(groupedResults)
    });
    
    return {
      success: true,
      data: {
        results: result.rows,
        grouped: groupedResults,
        total: result.rows.length,
        query: cleanQuery,
        type: 'global',
        duration: `${duration}ms`,
        entityTypes: Object.keys(groupedResults)
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error('Global search failed', { 
      error: error.message,
      query,
      userId,
      limit,
      duration: `${duration}ms`,
      stack: error.stack
    });
    
    return {
      success: false,
      error: 'Search failed',
      message: error.message,
      duration: `${duration}ms`
    };
  }
}
```

## 📋 **PHASE 4: IMPROVE HEALTH MONITORING**

### **Step 4.1: Enhanced Health Endpoint**
```javascript
// File: server/app.js
// Update health endpoint with comprehensive checks

app.get('/api/health', async (req, res) => {
  const detailed = req.query.detailed === 'true';
  const startTime = Date.now();
  
  try {
    // Basic health check
    const basicHealth = {
      status: 'ok',
      message: 'Manito API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      authenticated: false
    };
    
    if (!detailed) {
      return res.json(basicHealth);
    }
    
    // Detailed health check
    const detailedHealth = {
      ...basicHealth,
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {}
    };
    
    // Database health
    try {
      const dbHealth = await enhancedDb.health();
      detailedHealth.services.database = {
        status: dbHealth.connected ? 'ok' : 'error',
        connected: dbHealth.connected,
        pool: dbHealth.pool,
        cache: dbHealth.cache,
        serverTime: dbHealth.serverTime,
        version: dbHealth.version,
        mockMode: dbHealth.mockMode,
        tables: dbHealth.tables?.length || 0,
        functions: dbHealth.functions?.length || 0,
        indexes: dbHealth.indexes?.length || 0,
        message: dbHealth.connected ? 'Database connected and healthy' : 'Database connection failed'
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'error',
        connected: false,
        error: error.message,
        message: 'Database health check failed'
      };
    }
    
    // WebSocket health
    try {
      const wsHealth = wsService.getHealth();
      detailedHealth.services.websocket = {
        status: wsHealth.status,
        connections: wsHealth.connections,
        uptime: wsHealth.uptime,
        timestamp: wsHealth.timestamp
      };
    } catch (error) {
      detailedHealth.services.websocket = {
        status: 'error',
        error: error.message,
        message: 'WebSocket health check failed'
      };
    }
    
    // Semantic search health
    try {
      const searchHealth = await semanticSearchService.getHealth();
      detailedHealth.services.semanticSearch = {
        status: searchHealth.status,
        features: searchHealth.features,
        indexes: searchHealth.indexes,
        functions: searchHealth.functions
      };
    } catch (error) {
      detailedHealth.services.semanticSearch = {
        status: 'error',
        error: error.message,
        message: 'Semantic search health check failed'
      };
    }
    
    // AI service health
    try {
      const aiHealth = await aiService.getHealth();
      detailedHealth.services.ai = {
        status: aiHealth.status,
        providers: aiHealth.providers
      };
    } catch (error) {
      detailedHealth.services.ai = {
        status: 'error',
        error: error.message,
        message: 'AI service health check failed'
      };
    }
    
    // Scan queue health
    try {
      const queueHealth = scanQueue.getHealth();
      detailedHealth.services.scanQueue = {
        status: queueHealth.status,
        queueLength: queueHealth.queueLength,
        runningJobs: queueHealth.runningJobs,
        maxConcurrentJobs: queueHealth.maxConcurrentJobs,
        totalJobs: queueHealth.totalJobs,
        jobsByStatus: queueHealth.jobsByStatus
      };
    } catch (error) {
      detailedHealth.services.scanQueue = {
        status: 'error',
        error: error.message,
        message: 'Scan queue health check failed'
      };
    }
    
    // Determine overall status
    const serviceStatuses = Object.values(detailedHealth.services).map(s => s.status);
    if (serviceStatuses.includes('error')) {
      detailedHealth.status = 'degraded';
    }
    
    const duration = Date.now() - startTime;
    detailedHealth.responseTime = `${duration}ms`;
    
    res.json(detailedHealth);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## 📋 **PHASE 5: TESTING & VALIDATION**

### **Step 5.1: Create Test Suite**
```javascript
// File: scripts/test-database-functionality.js
// Comprehensive test suite

import enhancedDb from '../server/services/enhancedDatabase.js';
import semanticSearch from '../server/services/semanticSearch.js';
import migrations from '../server/services/migrations.js';

async function runDatabaseTests() {
  console.log('🧪 Starting Database Functionality Tests...\n');
  
  const tests = [
    {
      name: 'Database Connection Test',
      test: async () => {
        const health = await enhancedDb.health();
        if (!health.connected) {
          throw new Error('Database not connected');
        }
        return '✅ Database connection successful';
      }
    },
    {
      name: 'Migration System Test',
      test: async () => {
        const status = await migrations.getMigrationStatus();
        if (status.pending > 0) {
          throw new Error(`${status.pending} pending migrations`);
        }
        return `✅ All ${status.applied} migrations applied successfully`;
      }
    },
    {
      name: 'Table Existence Test',
      test: async () => {
        const requiredTables = ['projects', 'scans', 'files', 'dependencies', 'conflicts', 'users', 'cache', 'search_logs', 'websocket_connections'];
        const health = await enhancedDb.health();
        
        for (const table of requiredTables) {
          if (!health.tables.includes(table)) {
            throw new Error(`Missing table: ${table}`);
          }
        }
        return `✅ All ${requiredTables.length} required tables exist`;
      }
    },
    {
      name: 'Function Existence Test',
      test: async () => {
        const requiredFunctions = ['global_search', 'search_projects', 'calculate_text_similarity'];
        const health = await enhancedDb.health();
        
        for (const func of requiredFunctions) {
          if (!health.functions.includes(func)) {
            throw new Error(`Missing function: ${func}`);
          }
        }
        return `✅ All ${requiredFunctions.length} required functions exist`;
      }
    },
    {
      name: 'Semantic Search Test',
      test: async () => {
        const result = await semanticSearch.globalSearch('test', null, 10);
        if (!result.success) {
          throw new Error(`Search failed: ${result.message}`);
        }
        return `✅ Semantic search working (${result.data.total} results)`;
      }
    },
    {
      name: 'Health Endpoint Test',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/health?detailed=true');
        const health = await response.json();
        
        if (health.status !== 'ok' && health.status !== 'degraded') {
          throw new Error(`Health endpoint returned status: ${health.status}`);
        }
        
        if (!health.services.database.connected) {
          throw new Error('Database not connected in health check');
        }
        
        return '✅ Health endpoint working correctly';
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Running: ${test.name}`);
      const result = await test.test();
      console.log(result);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! Database functionality is 100% operational.');
  }
}

runDatabaseTests().catch(console.error);
```

## 📋 **PHASE 6: DEPLOYMENT & MONITORING**

### **Step 6.1: Add Monitoring Endpoints**
```javascript
// File: server/app.js
// Add monitoring endpoints

app.get('/api/monitoring/database', async (req, res) => {
  try {
    const health = await enhancedDb.health();
    const poolStats = await enhancedDb.getPoolStats();
    
    res.json({
      success: true,
      data: {
        health,
        poolStats,
        cacheStats: enhancedDb.cacheStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database monitoring failed',
      message: error.message
    });
  }
});

app.get('/api/monitoring/search', async (req, res) => {
  try {
    const searchStats = await semanticSearchService.getStats();
    res.json({
      success: true,
      data: searchStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search monitoring failed',
      message: error.message
    });
  }
});
```

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Migration System** ✅
- [ ] Fix migration error handling and logging
- [ ] Add migration verification
- [ ] Fix schema handling in queries
- [ ] Add migration status endpoints
- [ ] Test migration system end-to-end

### **Phase 2: Database Service** ✅
- [ ] Improve health monitoring
- [ ] Add connection pool monitoring
- [ ] Enhance error handling
- [ ] Add comprehensive logging
- [ ] Test database service thoroughly

### **Phase 3: Semantic Search** ✅
- [ ] Create robust search functions
- [ ] Enhance semantic search service
- [ ] Add input validation
- [ ] Implement search analytics
- [ ] Test search functionality

### **Phase 4: Health Monitoring** ✅
- [ ] Enhance health endpoint
- [ ] Add detailed service checks
- [ ] Implement status aggregation
- [ ] Add response time monitoring
- [ ] Test health monitoring

### **Phase 5: Testing** ✅
- [ ] Create comprehensive test suite
- [ ] Test all database operations
- [ ] Test search functionality
- [ ] Test health endpoints
- [ ] Validate end-to-end functionality

### **Phase 6: Deployment** ✅
- [ ] Add monitoring endpoints
- [ ] Implement logging aggregation
- [ ] Add performance metrics
- [ ] Create deployment scripts
- [ ] Validate production readiness

## 🚀 **EXECUTION INSTRUCTIONS**

1. **Start with Phase 1** - Fix the migration system first as it's critical
2. **Test each phase** - Run tests after completing each phase
3. **Monitor logs** - Watch for errors and warnings during implementation
4. **Validate functionality** - Test all endpoints and features
5. **Deploy incrementally** - Deploy changes in small batches
6. **Monitor performance** - Track response times and error rates

## 📊 **SUCCESS METRICS**

- ✅ All database tables created successfully
- ✅ All search functions working
- ✅ Health endpoint shows accurate status
- ✅ No silent failures in migration system
- ✅ Comprehensive error logging
- ✅ 100% test coverage
- ✅ Performance within acceptable limits
- ✅ Production-ready monitoring

**Goal**: 100% functional database and semantic search with leading-edge technologies and best practices.
