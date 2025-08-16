import pg from 'pg';
import winston from 'winston';
import { EventEmitter } from 'events';

const { Pool } = pg;

class EnhancedDatabaseService extends EventEmitter {
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

  initialize() {
    const config = {
      user: process.env.POSTGRES_USER || 'manito_dev',
      password: process.env.POSTGRES_PASSWORD || 'manito_dev_password',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'manito_dev',
      port: process.env.POSTGRES_PORT || 5432,
      schema: process.env.POSTGRES_SCHEMA || 'manito_dev',
      
      // Enhanced connection pool settings
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 600000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      
      // Statement timeout
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
      
      // SSL configuration
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      
      // Application name for monitoring
      application_name: 'manito-enhanced-db'
    };

    this.pool = new Pool(config);
    this.schema = config.schema;

    // Enhanced pool event handling
    this.pool.on('error', (err, client) => {
      this.logger.error('Unexpected error on idle client', { 
        error: err.message,
        code: err.code,
        stack: err.stack 
      });
      this.emit('poolError', err);
    });

    this.pool.on('connect', (client) => {
      this.logger.debug('New client connected to pool');
      this.emit('clientConnected', client);
    });

    this.pool.on('remove', (client) => {
      this.logger.debug('Client removed from pool');
      this.emit('clientRemoved', client);
    });

    // Test connection and initialize
    this.testConnection();
    
    this.logger.info('Enhanced database service initialized', { 
      host: config.host, 
      database: config.database,
      schema: config.schema,
      poolSize: `${config.min}-${config.max}`
    });
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query(`SET search_path TO ${this.schema}`);
      await client.query('SELECT 1');
      client.release();
      this.logger.info('Database connection successful');
      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.logger.warn('Database connection failed, running in mock mode', { 
        error: error.message,
        code: error.code 
      });
      this.connected = false;
      this.emit('connectionFailed', error);
      this.initializeMockData();
    }
  }

  initializeMockData() {
    this.mockData.set('projects', []);
    this.mockData.set('scans', []);
    this.mockData.set('files', []);
    this.mockData.set('conflicts', []);
    this.mockData.set('dependencies', []);
    this.mockData.set('metrics', []);
    this.mockData.set('search_logs', []);
    this.mockData.set('websocket_connections', []);
  }

  // Security validation methods
  validateQueryInput(text, params) {
    // Prevent SQL injection
    if (typeof text !== 'string') {
      throw new Error('Query text must be a string');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*update\s+.+\s+set/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /xp_cmdshell/i,
      /sp_executesql/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        throw new Error('Potentially dangerous SQL detected');
      }
    }
    
    // Validate parameters
    if (!Array.isArray(params)) {
      throw new Error('Parameters must be an array');
    }
    
    // Check parameter types
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (param !== null && typeof param === 'object' && !Array.isArray(param)) {
        throw new Error(`Parameter ${i} contains object - potential injection risk`);
      }
    }
  }

  // Rate limiting
  async checkRateLimit() {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxQueries = 1000; // Max queries per minute
    
    // Clean old entries
    this.queryHistory = this.queryHistory || [];
    this.queryHistory = this.queryHistory.filter(time => now - time < windowMs);
    
    // Check if limit exceeded
    if (this.queryHistory.length >= maxQueries) {
      throw new Error('Query rate limit exceeded');
    }
    
    // Add current query
    this.queryHistory.push(now);
  }

  // Enhanced query method with caching, monitoring, and security
  async query(text, params = [], options = {}) {
    const {
      cacheKey = null,
      cacheTTL = 300, // 5 minutes default
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      skipSchema = false, // New option for queries that don't need schema
      validateInput = true // Security validation
    } = options;

    // Security validation
    if (validateInput) {
      this.validateQueryInput(text, params);
    }

    // Rate limiting check
    await this.checkRateLimit();

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
          attempt: attempt + 1
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
          params: params.length
        });
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Duplicate entry found');
        } else if (error.code === '23503') { // Foreign key violation
          throw new Error('Referenced record not found');
        } else if (error.code === '42P01') { // Table doesn't exist
          throw new Error('Database table not found - please run initialization');
        } else if (error.code === '57014') { // Statement timeout
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

  // Enhanced transaction method with retry logic
  async transaction(callback, options = {}) {
    const { retries = 3, retryDelay = 1000 } = options;
    let attempt = 0;
    
    while (attempt < retries) {
      const client = await this.pool.connect();
      
      try {
        await client.query(`SET search_path TO ${this.schema}`);
        await client.query('BEGIN');
        
        // Execute the callback with the client
        const result = await callback(client);
        
        await client.query('COMMIT');
        client.release();
        
        this.logger.debug('Transaction completed successfully', { attempt: attempt + 1 });
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        
        attempt++;
        this.logger.error('Transaction error', { 
          error: error.message,
          attempt,
          retries 
        });
        
        if (attempt >= retries) {
          throw error;
        }
        
        // Retry logic for transient errors
        if (this.isRetryableError(error)) {
          this.logger.warn(`Retrying transaction (attempt ${attempt}/${retries})`, { 
            error: error.message 
          });
          await this.delay(retryDelay * attempt);
          continue;
        }
        
        throw error;
      }
    }
  }

  // Vector search capabilities
  async vectorSearch(table, vectorColumn, queryVector, options = {}) {
    const {
      limit = 10,
      similarityThreshold = 0.7,
      additionalColumns = ['*'],
      whereClause = '',
      whereParams = []
    } = options;

    const columns = additionalColumns.join(', ');
    const whereSQL = whereClause ? `WHERE ${whereClause}` : '';
    
    const query = `
      SELECT ${columns}, 
             ${vectorColumn} <=> $1 as similarity
      FROM ${table}
      ${whereSQL}
      HAVING ${vectorColumn} <=> $1 < $2
      ORDER BY similarity ASC
      LIMIT $3
    `;

    const params = [queryVector, similarityThreshold, limit, ...whereParams];
    
    try {
      const result = await this.query(query, params, {
        cacheKey: `vector_search_${table}_${JSON.stringify(queryVector)}`,
        cacheTTL: 60 // 1 minute cache for vector searches
      });
      
      return result.rows;
    } catch (error) {
      this.logger.error('Vector search failed', { 
        table, 
        error: error.message 
      });
      throw error;
    }
  }

  // Semantic search with full-text capabilities
  async semanticSearch(query, options = {}) {
    const {
      tables = ['projects', 'scans', 'files', 'dependencies', 'conflicts'],
      limit = 50,
      userId = null,
      filters = {}
    } = options;

    try {
      // Use the global search function if available
      const result = await this.query(
        'SELECT * FROM global_search($1, $2, $3)',
        [query, userId, limit],
        {
          cacheKey: `semantic_search_${query}_${userId}_${limit}`,
          cacheTTL: 300 // 5 minutes cache
        }
      );
      
      return result.rows;
    } catch (error) {
      this.logger.error('Semantic search failed', { 
        query, 
        error: error.message 
      });
      
      // Fallback to basic text search
      return this.fallbackTextSearch(query, tables, limit, userId, filters);
    }
  }

  // Fallback text search implementation
  async fallbackTextSearch(query, tables, limit, userId, filters) {
    const results = [];
    
    for (const table of tables) {
      try {
        const tableResults = await this.query(
          `SELECT *, '${table}' as entity_type FROM ${table} 
           WHERE to_tsvector('english', *) @@ plainto_tsquery('english', $1)
           ${userId ? 'AND user_id = $2' : ''}
           LIMIT $${userId ? '3' : '2'}`,
          userId ? [query, userId, limit] : [query, limit]
        );
        
        results.push(...tableResults.rows);
      } catch (error) {
        this.logger.warn(`Fallback search failed for table ${table}`, { 
          error: error.message 
        });
      }
    }
    
    return results.slice(0, limit);
  }

  // Enhanced insert with conflict resolution
  async insert(table, data, options = {}) {
    const {
      conflictColumns = [],
      conflictAction = 'DO NOTHING',
      returning = '*',
      onConflict = null
    } = options;

    if (!this.connected) {
      return this.mockInsert(table, data);
    }
    
    const processedData = this.processDataForInsert(data);
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    
    let query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;
    
    if (conflictColumns.length > 0) {
      query += ` ON CONFLICT (${conflictColumns.join(', ')}) ${conflictAction}`;
      if (onConflict) {
        query += ` ${onConflict}`;
      }
    }
    
    query += ` RETURNING ${returning}`;
    
    try {
      const result = await this.query(query, values);
      return result.rows[0];
    } catch (error) {
      this.logger.error('Insert failed', { 
        table, 
        error: error.message, 
        data: keys 
      });
      throw error;
    }
  }

  // Enhanced update with optimistic locking
  async update(table, data, where, whereParams = [], options = {}) {
    const {
      versionColumn = null,
      versionValue = null,
      returning = '*'
    } = options;

    if (!this.connected) {
      return this.mockUpdate(table, data, where, whereParams);
    }
    
    const processedData = this.processDataForUpdate(data);
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    
    let setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    let whereClause = where;
    let finalParams = [...values, ...whereParams];
    
    // Add optimistic locking if version column is provided
    if (versionColumn && versionValue !== null) {
      setClause += `, ${versionColumn} = ${versionColumn} + 1`;
      whereClause += ` AND ${versionColumn} = $${finalParams.length + 1}`;
      finalParams.push(versionValue);
    }
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING ${returning}
    `;
    
    try {
      const result = await this.query(query, finalParams);
      if (result.rows.length === 0) {
        throw new Error('No rows updated - possible optimistic lock conflict');
      }
      return result.rows[0];
    } catch (error) {
      this.logger.error('Update failed', { 
        table, 
        error: error.message 
      });
      throw error;
    }
  }

  // Enhanced select with advanced features
  async select(table, options = {}) {
    const {
      where = '',
      whereParams = [],
      orderBy = '',
      limit = '',
      offset = '',
      columns = ['*'],
      joins = [],
      groupBy = '',
      having = '',
      cacheKey = null,
      cacheTTL = 300
    } = options;

    if (!this.connected) {
      return this.mockSelect(table, where, whereParams, orderBy, limit);
    }
    
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    
    // Add joins
    if (joins.length > 0) {
      query += ' ' + joins.join(' ');
    }
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (groupBy) {
      query += ` GROUP BY ${groupBy}`;
    }
    
    if (having) {
      query += ` HAVING ${having}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    
    const result = await this.query(query, whereParams, {
      cacheKey,
      cacheTTL
    });
    
    return result.rows;
  }

  // Cache management
  async getCache(key) {
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() < cached.expires) {
        this.cacheStats.hits++;
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }
    this.cacheStats.misses++;
    return null;
  }

  async setCache(key, value, expiresInSeconds = 3600) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + (expiresInSeconds * 1000)
    });
    this.cacheStats.sets++;
  }

  async deleteCache(key) {
    if (this.cache.delete(key)) {
      this.cacheStats.deletes++;
    }
  }

  async clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info('Cache cleared', { clearedEntries: size });
  }

  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      size: this.cache.size
    };
  }

  // Health check with detailed metrics
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
      indexes: [],
      security: {
        rateLimitActive: true,
        inputValidation: true,
        suspiciousQueriesBlocked: this.suspiciousQueriesBlocked || 0
      }
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

  // Utility methods
  processDataForInsert(data) {
    const processed = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        try {
          processed[key] = JSON.stringify(value);
        } catch (error) {
          this.logger.error('JSON serialization failed', { field: key, error: error.message });
          processed[key] = '{}';
        }
      } else {
        processed[key] = value;
      }
    }
    return processed;
  }

  processDataForUpdate(data) {
    return this.processDataForInsert(data);
  }

  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      '08000', // Connection exception
      '08003', // Connection does not exist
      '08006', // Connection failure
      '57014'  // Statement timeout
    ];
    
    return retryableCodes.includes(error.code);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock methods for when database is not available
  mockQuery(text, params = []) {
    this.logger.debug('Using mock query', { query: text.substring(0, 50) });
    
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    
    if (text.includes('global_search')) {
      return { rows: [] };
    }
    
    return { rows: [] };
  }

  mockInsert(table, data) {
    const record = { 
      id: this.nextId++,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (!this.mockData.has(table)) {
      this.mockData.set(table, []);
    }
    
    this.mockData.get(table).push(record);
    return record;
  }

  mockSelect(table, where = '', whereParams = [], orderBy = '', limit = '') {
    if (!this.mockData.has(table)) {
      return [];
    }
    
    let records = [...this.mockData.get(table)];
    
    if (where && whereParams.length > 0) {
      const fieldMatch = where.match(/(\w+)\s*=\s*\$1/);
      if (fieldMatch && whereParams[0] !== undefined) {
        const field = fieldMatch[1];
        const value = whereParams[0];
        records = records.filter(record => record[field] == value);
      }
    }
    
    if (orderBy) {
      if (orderBy.includes('DESC')) {
        const field = orderBy.replace(/\s+DESC/i, '').trim();
        records.sort((a, b) => new Date(b[field]) - new Date(a[field]));
      } else {
        const field = orderBy.trim();
        records.sort((a, b) => new Date(a[field]) - new Date(b[field]));
      }
    }
    
    if (limit && parseInt(limit) > 0) {
      records = records.slice(0, parseInt(limit));
    }
    
    return records;
  }

  mockUpdate(table, data, where, whereParams = []) {
    if (!this.mockData.has(table)) {
      return null;
    }
    
    const records = this.mockData.get(table);
    let updated = null;
    
    if (where.includes('id = $1') && whereParams[0]) {
      const index = records.findIndex(record => record.id == whereParams[0]);
      if (index >= 0) {
        updated = { 
          ...records[index], 
          ...data, 
          updated_at: new Date() 
        };
        records[index] = updated;
      }
    }
    
    return updated;
  }

  // Graceful shutdown
  async close() {
    this.logger.info('Shutting down enhanced database service...');
    
    // Clear cache
    this.clearCache();
    
    // Close pool
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Database connection pool closed');
    }
    
    this.emit('closed');
  }
}

// Create and export singleton instance
const enhancedDatabaseService = new EnhancedDatabaseService();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down enhanced database connection...');
  await enhancedDatabaseService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down enhanced database connection...');
  await enhancedDatabaseService.close();
  process.exit(0);
});

export default enhancedDatabaseService;
