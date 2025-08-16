import enhancedDb from '../services/enhancedDatabase.js';

class Project {
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.path = data.path;
    this.description = data.description;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.last_scanned_at = data.last_scanned_at;
    this.scan_status = data.scan_status || 'pending';
  }

  // Create a new project
  static async create(projectData, userId = null) {
    const { name, path, description = null } = projectData;
    
    if (!name || !path) {
      throw new Error('Project name and path are required');
    }

    try {
      const insertData = {
        name,
        path,
        description,
        scan_status: 'pending'
      };

      // Add user_id if provided (allows anonymous projects for backward compatibility)
      if (userId) {
        insertData.user_id = userId;
      }

      const result = await enhancedDb.insert('projects', insertData);

      return new Project(result);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A project with this path already exists for this user');
      }
      throw error;
    }
  }

  // Find project by ID
  static async findById(id) {
    const projects = await enhancedDb.select('projects', { where: 'id = $1', whereParams: [id] });
    return projects.length > 0 ? new Project(projects[0]) : null;
  }

  // Find project by path
  static async findByPath(path, userId = null) {
    let whereClause = 'path = $1';
    let params = [path];
    
    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
    } else {
      whereClause += ' AND user_id IS NULL';
    }
    
    const projects = await enhancedDb.select('projects', { where: whereClause, whereParams: params });
    return projects.length > 0 ? new Project(projects[0]) : null;
  }

  // Find projects by user ID
  static async findByUserId(userId, limit = 50, offset = 0) {
    const projects = await enhancedDb.select('projects', {
      where: 'user_id = $1',
      whereParams: [userId],
      orderBy: 'updated_at DESC',
      limit: `${limit} OFFSET ${offset}`
    });
    
    return projects.map(project => new Project(project));
  }

  // Get all projects with optional pagination
  static async findAll(limit = 50, offset = 0) {
    const projects = await enhancedDb.select('projects', {
      where: '',
      whereParams: [],
      orderBy: 'updated_at DESC',
      limit: `${limit} OFFSET ${offset}`
    });
    
    return projects.map(project => new Project(project));
  }

  // Get project summary with latest scan info
  static async findAllWithSummary() {
    const result = await enhancedDb.query(`
      SELECT 
        p.id,
        p.name,
        p.path,
        p.description,
        p.created_at,
        p.updated_at,
        p.last_scanned_at,
        p.scan_status,
        s.id as latest_scan_id,
        s.files_scanned,
        s.lines_of_code,
        s.conflicts_found,
        COALESCE(s.results->>'health_score', '0')::INTEGER as health_score
      FROM projects p
      LEFT JOIN LATERAL (
        SELECT id, files_scanned, lines_of_code, conflicts_found, results
        FROM scans 
        WHERE project_id = p.id AND status = 'completed'
        ORDER BY completed_at DESC 
        LIMIT 1
      ) s ON true
      ORDER BY p.updated_at DESC
    `);

    return result.rows.map(row => ({
      project: new Project(row),
      latest_scan: {
        id: row.latest_scan_id,
        files_scanned: row.files_scanned,
        lines_of_code: row.lines_of_code,
        conflicts_found: row.conflicts_found,
        health_score: row.health_score
      }
    }));
  }

  // Update project
  async update(updates) {
    const allowedUpdates = ['name', 'description', 'last_scanned_at', 'scan_status'];
    const updateData = {};
    
    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const result = await enhancedDb.update('projects', updateData, 'id = $1', [this.id]);
    
    if (result) {
      Object.assign(this, result);
      return this;
    }
    
    throw new Error('Project not found');
  }

  // Delete project and all related data
  async delete() {
    const result = await enhancedDb.delete('projects', 'id = $1', [this.id]);
    return result.length > 0;
  }

  // Get all scans for this project
  async getScans(limit = 10) {
    const Scan = (await import('./Scan.js')).default;
    return await Scan.findByProjectId(this.id, limit);
  }

  // Get the latest completed scan
  async getLatestScan() {
    const result = await enhancedDb.query(`
      SELECT * FROM scans 
      WHERE project_id = $1 AND status = 'completed'
      ORDER BY completed_at DESC 
      LIMIT 1
    `, [this.id]);

    if (result.rows.length === 0) return null;

    const Scan = (await import('./Scan.js')).default;
    return new Scan(result.rows[0]);
  }

  // Update scan status
  async updateScanStatus(status) {
    return this.update({ 
      scan_status: status,
      last_scanned_at: status === 'completed' ? new Date() : this.last_scanned_at
    });
  }

  // Serialize for API response
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_scanned_at: this.last_scanned_at,
      scan_status: this.scan_status
    };
  }

  // Search projects by name or path
  static async search(query, limit = 20) {
    const result = await enhancedDb.query(`
      SELECT *, 
        ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) as rank
      FROM projects 
      WHERE 
        name ILIKE $2 OR 
        path ILIKE $2 OR 
        description ILIKE $2 OR
        to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, updated_at DESC
      LIMIT $3
    `, [query, `%${query}%`, limit]);

    return result.rows.map(project => new Project(project));
  }

  // Get project statistics
  async getStatistics() {
    const result = await enhancedDb.query(`
      SELECT 
        COUNT(s.id) as total_scans,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_scans,
        COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_scans,
        MAX(s.files_scanned) as max_files_scanned,
        MAX(s.lines_of_code) as max_lines_of_code,
        AVG(CASE WHEN s.status = 'completed' THEN s.conflicts_found END) as avg_conflicts,
        MAX(s.completed_at) as last_successful_scan
      FROM scans s
      WHERE s.project_id = $1
    `, [this.id]);

    return result.rows[0];
  }
}

export default Project;