import pg from 'pg';
import winston from 'winston';

const { Pool } = pg;

class DatabaseService {
  constructor() {
    this.pool = null;
    this.connected = false;
    this.mockData = new Map(); // In-memory storage when DB is not available
    this.nextId = 1;
    
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
      // Connection pool settings
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 600000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);
    this.schema = config.schema;

    // Handle pool errors
    this.pool.on('error', (err, client) => {
      this.logger.error('Unexpected error on idle client', { error: err.message });
    });

    // Test connection
    this.testConnection();
    
    this.logger.info('Database service initialized', { 
      host: config.host, 
      database: config.database,
      schema: config.schema
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
    } catch (error) {
      this.logger.warn('Database connection failed, running in mock mode', { error: error.message });
      this.connected = false;
      // Initialize mock data structure
      this.mockData.set('projects', []);
      this.mockData.set('scans', []);
      this.mockData.set('files', []);
      this.mockData.set('conflicts', []);
      this.mockData.set('dependencies', []);
      this.mockData.set('metrics', []);
    }
  }

  async query(text, params = []) {
    if (!this.connected) {
      return this.mockQuery(text, params);
    }
    
    const start = Date.now();
    try {
      const client = await this.pool.connect();
      await client.query(`SET search_path TO ${this.schema}`);
      const res = await client.query(text, params);
      client.release();
      
      const duration = Date.now() - start;
      this.logger.debug('Executed query', { 
        duration: `${duration}ms`,
        rows: res.rows.length,
        command: res.command
      });
      
      return res;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error('Query error', { 
        error: error.message,
        duration: `${duration}ms`,
        query: text
      });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query(`SET search_path TO ${this.schema}`);
      await client.query('BEGIN');
      
      // Execute the callback with the client
      const result = await callback(client);
      
      await client.query('COMMIT');
      client.release();
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      
      this.logger.error('Transaction error', { error: error.message });
      throw error;
    }
  }

  // Health check method
  async health() {
    try {
      const result = await this.query('SELECT NOW(), version()', []);
      const stats = {
        connected: true,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
        serverTime: result.rows[0].now,
        version: result.rows[0].version
      };
      return stats;
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Cleanup method
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Database connection pool closed');
    }
  }

  // Helper method for INSERT queries with RETURNING
  async insert(table, data, returning = '*') {
    if (!this.connected) {
      return this.mockInsert(table, data);
    }
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returning}
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  // Helper method for UPDATE queries
  async update(table, data, where, whereParams = []) {
    if (!this.connected) {
      return this.mockUpdate(table, data, where, whereParams);
    }
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = where;
    
    // Adjust parameter numbers for WHERE clause
    const adjustedWhereParams = whereParams.map((_, i) => `$${values.length + i + 1}`);
    const finalWhereClause = whereClause.replace(/\$(\d+)/g, (match, num) => {
      const index = parseInt(num) - 1;
      return adjustedWhereParams[index] || match;
    });
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${finalWhereClause}
      RETURNING *
    `;
    
    const result = await this.query(query, [...values, ...whereParams]);
    return result.rows[0];
  }

  // Helper method for SELECT queries with common patterns
  async select(table, where = '', whereParams = [], orderBy = '', limit = '') {
    if (!this.connected) {
      return this.mockSelect(table, where, whereParams, orderBy, limit);
    }
    
    let query = `SELECT * FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    const result = await this.query(query, whereParams);
    return result.rows;
  }

  // Helper method for DELETE queries
  async delete(table, where, whereParams = []) {
    const query = `DELETE FROM ${table} WHERE ${where} RETURNING *`;
    const result = await this.query(query, whereParams);
    return result.rows;
  }

  // Cache management
  async getCache(key) {
    const result = await this.query(
      'SELECT cache_value FROM cache WHERE cache_key = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [key]
    );
    return result.rows[0]?.cache_value || null;
  }

  async setCache(key, value, expiresInSeconds = 3600) {
    const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));
    
    await this.query(`
      INSERT INTO cache (cache_key, cache_value, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (cache_key)
      DO UPDATE SET
        cache_value = EXCLUDED.cache_value,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `, [key, JSON.stringify(value), expiresAt]);
  }

  async clearExpiredCache() {
    const result = await this.query('SELECT cleanup_expired_cache()');
    return result.rows[0].cleanup_expired_cache;
  }

  // Mock methods for when database is not available
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
    
    // Simple filtering - just check basic equality conditions
    if (where && whereParams.length > 0) {
      // Very basic where clause parsing for mock - just handles "field = $1"
      const fieldMatch = where.match(/(\w+)\s*=\s*\$1/);
      if (fieldMatch && whereParams[0] !== undefined) {
        const field = fieldMatch[1];
        const value = whereParams[0];
        records = records.filter(record => record[field] == value);
      }
    }
    
    // Basic ordering
    if (orderBy) {
      if (orderBy.includes('DESC')) {
        const field = orderBy.replace(/\s+DESC/i, '').trim();
        records.sort((a, b) => new Date(b[field]) - new Date(a[field]));
      } else {
        const field = orderBy.trim();
        records.sort((a, b) => new Date(a[field]) - new Date(b[field]));
      }
    }
    
    // Limit
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
    
    // Simple update - handle "id = $1"
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

  mockQuery(text, params = []) {
    // Handle some basic queries
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    
    // Handle joins for recent scans
    if (text.includes('FROM scans s') && text.includes('JOIN projects p')) {
      const scans = this.mockData.get('scans') || [];
      const projects = this.mockData.get('projects') || [];
      
      const joined = scans.map(scan => {
        const project = projects.find(p => p.id === scan.project_id);
        return {
          ...scan,
          project_name: project?.name || 'Unknown',
          project_path: project?.path || 'Unknown'
        };
      }).slice(0, params[0] || 20);
      
      return { rows: joined };
    }
    
    return { rows: [] };
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down database connection...');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database connection...');
  await databaseService.close();
  process.exit(0);
});

export default databaseService;