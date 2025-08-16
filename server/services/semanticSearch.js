import db from './database.js';
import winston from 'winston';

class SemanticSearchService {
  constructor() {
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

  async initialize() {
    try {
      // Create semantic search indexes and functions
      await this.createSearchIndexes();
      await this.createSearchFunctions();
      this.logger.info('Semantic search service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize semantic search service', { error: error.message });
    }
  }

  async createSearchIndexes() {
    // Create GIN indexes for full-text search
    const indexes = [
      // Projects table indexes
      `CREATE INDEX IF NOT EXISTS idx_projects_name_fts ON projects USING GIN(to_tsvector('english', name))`,
      `CREATE INDEX IF NOT EXISTS idx_projects_description_fts ON projects USING GIN(to_tsvector('english', COALESCE(description, '')))`,
      `CREATE INDEX IF NOT EXISTS idx_projects_path_fts ON projects USING GIN(to_tsvector('english', path))`,
      
      // Scans table indexes
      `CREATE INDEX IF NOT EXISTS idx_scans_results_fts ON scans USING GIN(to_tsvector('english', results::text))`,
      `CREATE INDEX IF NOT EXISTS idx_scans_metadata_fts ON scans USING GIN(to_tsvector('english', metadata::text))`,
      
      // Files table indexes (if exists)
      `CREATE INDEX IF NOT EXISTS idx_files_content_fts ON files USING GIN(to_tsvector('english', content))`,
      `CREATE INDEX IF NOT EXISTS idx_files_path_fts ON files USING GIN(to_tsvector('english', file_path))`,
      
      // Dependencies table indexes
      `CREATE INDEX IF NOT EXISTS idx_dependencies_name_fts ON dependencies USING GIN(to_tsvector('english', name))`,
      `CREATE INDEX IF NOT EXISTS idx_dependencies_type_fts ON dependencies USING GIN(to_tsvector('english', type))`,
      
      // Conflicts table indexes
      `CREATE INDEX IF NOT EXISTS idx_conflicts_description_fts ON conflicts USING GIN(to_tsvector('english', description))`,
      `CREATE INDEX IF NOT EXISTS idx_conflicts_type_fts ON conflicts USING GIN(to_tsvector('english', type))`,
      
      // Composite indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_projects_search_composite ON projects USING GIN(
        to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || path)
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_scans_search_composite ON scans USING GIN(
        to_tsvector('english', results::text || ' ' || COALESCE(metadata::text, ''))
      )`
    ];

    for (const index of indexes) {
      try {
        await db.query(index);
      } catch (error) {
        // Index might already exist, continue
        this.logger.debug('Index creation skipped (may already exist)', { index: index.substring(0, 50) });
      }
    }
  }

  async createSearchFunctions() {
    const functions = [
      // Function to calculate text similarity
      `CREATE OR REPLACE FUNCTION calculate_text_similarity(text1 text, text2 text)
       RETURNS float AS $$
       BEGIN
         RETURN similarity(text1, text2);
       END;
       $$ LANGUAGE plpgsql;`,

      // Function to search projects with ranking
      `CREATE OR REPLACE FUNCTION search_projects(search_query text, user_id integer DEFAULT NULL)
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
       $$ LANGUAGE plpgsql;`,

      // Function to search scan results
      `CREATE OR REPLACE FUNCTION search_scan_results(search_query text, project_id integer DEFAULT NULL)
       RETURNS TABLE(
         id integer,
         project_id integer,
         project_name text,
         files_scanned integer,
         lines_of_code integer,
         conflicts_found integer,
         status text,
         created_at timestamp,
         completed_at timestamp,
         rank float,
         match_type text
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT 
           s.id,
           s.project_id,
           p.name as project_name,
           s.files_scanned,
           s.lines_of_code,
           s.conflicts_found,
           s.status,
           s.created_at,
           s.completed_at,
           ts_rank(
             to_tsvector('english', s.results::text || ' ' || COALESCE(s.metadata::text, '')),
             plainto_tsquery('english', search_query)
           ) as rank,
           CASE 
             WHEN s.results::text ILIKE '%' || search_query || '%' THEN 'exact_results'
             WHEN s.metadata::text ILIKE '%' || search_query || '%' THEN 'exact_metadata'
             ELSE 'semantic'
           END as match_type
         FROM scans s
         JOIN projects p ON s.project_id = p.id
         WHERE 
           (project_id IS NULL OR s.project_id = project_id)
           AND (
             to_tsvector('english', s.results::text || ' ' || COALESCE(s.metadata::text, '')) @@ plainto_tsquery('english', search_query)
             OR s.results::text ILIKE '%' || search_query || '%'
             OR s.metadata::text ILIKE '%' || search_query || '%'
           )
         ORDER BY rank DESC, s.created_at DESC;
       END;
       $$ LANGUAGE plpgsql;`,

      // Function to search files
      `CREATE OR REPLACE FUNCTION search_files(search_query text, project_id integer DEFAULT NULL)
       RETURNS TABLE(
         id integer,
         project_id integer,
         file_path text,
         content text,
         lines integer,
         size integer,
         complexity integer,
         created_at timestamp,
         rank float,
         match_type text
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT 
           f.id,
           f.project_id,
           f.file_path,
           f.content,
           f.lines,
           f.size,
           f.complexity,
           f.created_at,
           ts_rank(
             to_tsvector('english', f.content || ' ' || f.file_path),
             plainto_tsquery('english', search_query)
           ) as rank,
           CASE 
             WHEN f.content ILIKE '%' || search_query || '%' THEN 'exact_content'
             WHEN f.file_path ILIKE '%' || search_query || '%' THEN 'exact_path'
             ELSE 'semantic'
           END as match_type
         FROM files f
         WHERE 
           (project_id IS NULL OR f.project_id = project_id)
           AND (
             to_tsvector('english', f.content || ' ' || f.file_path) @@ plainto_tsquery('english', search_query)
             OR f.content ILIKE '%' || search_query || '%'
             OR f.file_path ILIKE '%' || search_query || '%'
           )
         ORDER BY rank DESC, f.created_at DESC;
       END;
       $$ LANGUAGE plpgsql;`,

      // Function to search dependencies
      `CREATE OR REPLACE FUNCTION search_dependencies(search_query text, project_id integer DEFAULT NULL)
       RETURNS TABLE(
         id integer,
         project_id integer,
         name text,
         version text,
         type text,
         source text,
         created_at timestamp,
         rank float,
         match_type text
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT 
           d.id,
           d.project_id,
           d.name,
           d.version,
           d.type,
           d.source,
           d.created_at,
           ts_rank(
             to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')),
             plainto_tsquery('english', search_query)
           ) as rank,
           CASE 
             WHEN d.name ILIKE '%' || search_query || '%' THEN 'exact_name'
             WHEN d.type ILIKE '%' || search_query || '%' THEN 'exact_type'
             ELSE 'semantic'
           END as match_type
         FROM dependencies d
         WHERE 
           (project_id IS NULL OR d.project_id = project_id)
           AND (
             to_tsvector('english', d.name || ' ' || d.type || ' ' || COALESCE(d.version, '')) @@ plainto_tsquery('english', search_query)
             OR d.name ILIKE '%' || search_query || '%'
             OR d.type ILIKE '%' || search_query || '%'
             OR d.version ILIKE '%' || search_query || '%'
           )
         ORDER BY rank DESC, d.created_at DESC;
       END;
       $$ LANGUAGE plpgsql;`,

      // Function to search conflicts
      `CREATE OR REPLACE FUNCTION search_conflicts(search_query text, project_id integer DEFAULT NULL)
       RETURNS TABLE(
         id integer,
         project_id integer,
         type text,
         description text,
         severity text,
         file_path text,
         line_number integer,
         created_at timestamp,
         rank float,
         match_type text
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT 
           c.id,
           c.project_id,
           c.type,
           c.description,
           c.severity,
           c.file_path,
           c.line_number,
           c.created_at,
           ts_rank(
             to_tsvector('english', c.type || ' ' || c.description || ' ' || COALESCE(c.file_path, '')),
             plainto_tsquery('english', search_query)
           ) as rank,
           CASE 
             WHEN c.type ILIKE '%' || search_query || '%' THEN 'exact_type'
             WHEN c.description ILIKE '%' || search_query || '%' THEN 'exact_description'
             WHEN c.file_path ILIKE '%' || search_query || '%' THEN 'exact_file'
             ELSE 'semantic'
           END as match_type
         FROM conflicts c
         WHERE 
           (project_id IS NULL OR c.project_id = project_id)
           AND (
             to_tsvector('english', c.type || ' ' || c.description || ' ' || COALESCE(c.file_path, '')) @@ plainto_tsquery('english', search_query)
             OR c.type ILIKE '%' || search_query || '%'
             OR c.description ILIKE '%' || search_query || '%'
             OR c.file_path ILIKE '%' || search_query || '%'
           )
         ORDER BY rank DESC, c.created_at DESC;
       END;
       $$ LANGUAGE plpgsql;`,

      // Function for global search across all entities
      `CREATE OR REPLACE FUNCTION global_search(search_query text, user_id integer DEFAULT NULL, limit_count integer DEFAULT 50)
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
       $$ LANGUAGE plpgsql;`
    ];

    for (const func of functions) {
      try {
        await db.query(func);
      } catch (error) {
        this.logger.debug('Function creation skipped (may already exist)', { error: error.message });
      }
    }
  }

  // Search methods
  async searchProjects(query, userId = null, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        'SELECT * FROM search_projects($1, $2) LIMIT $3 OFFSET $4',
        [query, userId, limit, offset]
      );
      
      return {
        results: result.rows,
        total: result.rows.length,
        query,
        type: 'projects'
      };
    } catch (error) {
      this.logger.error('Project search failed', { error: error.message, query });
      throw error;
    }
  }

  async searchScanResults(query, projectId = null, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        'SELECT * FROM search_scan_results($1, $2) LIMIT $3 OFFSET $4',
        [query, projectId, limit, offset]
      );
      
      return {
        results: result.rows,
        total: result.rows.length,
        query,
        type: 'scan_results'
      };
    } catch (error) {
      this.logger.error('Scan results search failed', { error: error.message, query });
      throw error;
    }
  }

  async searchFiles(query, projectId = null, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        'SELECT * FROM search_files($1, $2) LIMIT $3 OFFSET $4',
        [query, projectId, limit, offset]
      );
      
      return {
        results: result.rows,
        total: result.rows.length,
        query,
        type: 'files'
      };
    } catch (error) {
      this.logger.error('Files search failed', { error: error.message, query });
      throw error;
    }
  }

  async searchDependencies(query, projectId = null, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        'SELECT * FROM search_dependencies($1, $2) LIMIT $3 OFFSET $4',
        [query, projectId, limit, offset]
      );
      
      return {
        results: result.rows,
        total: result.rows.length,
        query,
        type: 'dependencies'
      };
    } catch (error) {
      this.logger.error('Dependencies search failed', { error: error.message, query });
      throw error;
    }
  }

  async searchConflicts(query, projectId = null, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        'SELECT * FROM search_conflicts($1, $2) LIMIT $3 OFFSET $4',
        [query, projectId, limit, offset]
      );
      
      return {
        results: result.rows,
        total: result.rows.length,
        query,
        type: 'conflicts'
      };
    } catch (error) {
      this.logger.error('Conflicts search failed', { error: error.message, query });
      throw error;
    }
  }

  async globalSearch(query, userId = null, limit = 50) {
    try {
      const result = await db.query(
        'SELECT * FROM global_search($1, $2, $3)',
        [query, userId, limit]
      );
      
      // Group results by entity type
      const groupedResults = {};
      result.rows.forEach(row => {
        if (!groupedResults[row.entity_type]) {
          groupedResults[row.entity_type] = [];
        }
        groupedResults[row.entity_type].push(row);
      });
      
      return {
        results: result.rows,
        grouped: groupedResults,
        total: result.rows.length,
        query,
        type: 'global'
      };
    } catch (error) {
      this.logger.error('Global search failed', { error: error.message, query });
      throw error;
    }
  }

  // Advanced search with filters
  async advancedSearch(options) {
    const {
      query,
      userId = null,
      entityTypes = ['projects', 'scans', 'files', 'dependencies', 'conflicts'],
      projectId = null,
      dateRange = null,
      severity = null,
      limit = 50,
      offset = 0
    } = options;

    try {
      let results = [];
      
      // Search each entity type
      for (const entityType of entityTypes) {
        let entityResults = [];
        
        switch (entityType) {
          case 'projects':
            entityResults = await this.searchProjects(query, userId, limit, offset);
            break;
          case 'scans':
            entityResults = await this.searchScanResults(query, projectId, limit, offset);
            break;
          case 'files':
            entityResults = await this.searchFiles(query, projectId, limit, offset);
            break;
          case 'dependencies':
            entityResults = await this.searchDependencies(query, projectId, limit, offset);
            break;
          case 'conflicts':
            entityResults = await this.searchConflicts(query, projectId, limit, offset);
            break;
        }
        
        results.push(...entityResults.results);
      }
      
      // Apply additional filters
      if (dateRange) {
        results = results.filter(result => {
          const resultDate = new Date(result.created_at || result.updated_at);
          return resultDate >= dateRange.start && resultDate <= dateRange.end;
        });
      }
      
      if (severity && entityTypes.includes('conflicts')) {
        results = results.filter(result => 
          result.entity_type !== 'conflict' || result.severity === severity
        );
      }
      
      // Sort by rank
      results.sort((a, b) => (b.rank || 0) - (a.rank || 0));
      
      return {
        results: results.slice(0, limit),
        total: results.length,
        query,
        filters: { entityTypes, projectId, dateRange, severity },
        type: 'advanced'
      };
    } catch (error) {
      this.logger.error('Advanced search failed', { error: error.message, options });
      throw error;
    }
  }

  // Search suggestions/autocomplete
  async getSearchSuggestions(query, userId = null, limit = 10) {
    try {
      const suggestions = [];
      
      // Get project name suggestions
      const projectSuggestions = await db.query(`
        SELECT DISTINCT name, 'project' as type
        FROM projects 
        WHERE (user_id IS NULL OR user_id = $1)
          AND name ILIKE $2
        LIMIT $3
      `, [userId, `%${query}%`, limit]);
      
      suggestions.push(...projectSuggestions.rows);
      
      // Get dependency name suggestions
      const dependencySuggestions = await db.query(`
        SELECT DISTINCT d.name, 'dependency' as type
        FROM dependencies d
        JOIN projects p ON d.project_id = p.id
        WHERE (p.user_id IS NULL OR p.user_id = $1)
          AND d.name ILIKE $2
        LIMIT $3
      `, [userId, `%${query}%`, limit]);
      
      suggestions.push(...dependencySuggestions.rows);
      
      // Get conflict type suggestions
      const conflictSuggestions = await db.query(`
        SELECT DISTINCT c.type, 'conflict' as type
        FROM conflicts c
        JOIN projects p ON c.project_id = p.id
        WHERE (p.user_id IS NULL OR p.user_id = $1)
          AND c.type ILIKE $2
        LIMIT $3
      `, [userId, `%${query}%`, limit]);
      
      suggestions.push(...conflictSuggestions.rows);
      
      return suggestions.slice(0, limit);
    } catch (error) {
      this.logger.error('Search suggestions failed', { error: error.message, query });
      return [];
    }
  }

  // Search analytics
  async getSearchAnalytics(userId = null, days = 30) {
    try {
      const result = await db.query(`
        SELECT 
          DATE(created_at) as search_date,
          COUNT(*) as search_count,
          AVG(rank) as avg_rank,
          COUNT(CASE WHEN rank > 0.5 THEN 1 END) as high_quality_matches
        FROM search_logs
        WHERE (user_id IS NULL OR user_id = $1)
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY search_date DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Search analytics failed', { error: error.message });
      return [];
    }
  }

  // Log search queries for analytics
  async logSearch(query, userId = null, entityType = null, resultCount = 0) {
    try {
      await db.query(`
        INSERT INTO search_logs (query, user_id, entity_type, result_count, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [query, userId, entityType, resultCount]);
    } catch (error) {
      // Search logging is optional, don't throw
      this.logger.debug('Failed to log search query', { error: error.message });
    }
  }
}

// Create and export singleton instance
const semanticSearchService = new SemanticSearchService();

export default semanticSearchService;
