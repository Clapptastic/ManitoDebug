import enhancedDb from '../services/enhancedDatabase.js';

class Scan {
  constructor(data = {}) {
    this.id = data.id;
    this.project_id = data.project_id;
    this.started_at = data.started_at;
    this.completed_at = data.completed_at;
    this.status = data.status || 'running';
    this.files_scanned = data.files_scanned || 0;
    this.lines_of_code = data.lines_of_code || 0;
    this.conflicts_found = data.conflicts_found || 0;
    this.scan_options = data.scan_options || {};
    this.results = data.results || {};
    this.error_message = data.error_message;
  }

  // Create a new scan
  static async create(scanData) {
    const {
      project_id,
      scan_options = {},
      status = 'running'
    } = scanData;

    if (!project_id) {
      throw new Error('Project ID is required');
    }

    const result = await enhancedDb.insert('scans', {
      project_id,
      started_at: new Date(),
      status,
      scan_options: scan_options // Database service will handle JSON serialization
    });

    return new Scan(result);
  }

  // Helper method to parse JSON fields
  static parseJsonFields(scan) {
    const fields = ['scan_options', 'results'];
    for (const field of fields) {
      if (scan[field] && typeof scan[field] === 'string') {
        try {
          scan[field] = JSON.parse(scan[field]);
        } catch (e) {
          // Keep original value if parsing fails
          console.warn(`Failed to parse JSON for field ${field}:`, e.message);
        }
      }
    }
    return scan;
  }

  // Find scan by ID
  static async findById(id) {
    const scans = await enhancedDb.select('scans', { where: 'id = $1', whereParams: [id] });
    if (scans.length === 0) return null;
    
    const scan = this.parseJsonFields(scans[0]);
    return new Scan(scan);
  }

  // Find scans by project ID
  static async findByProjectId(projectId, limit = 10) {
    const scans = await enhancedDb.select('scans', {
      where: 'project_id = $1',
      whereParams: [projectId],
      orderBy: 'started_at DESC',
      limit: limit
    });

    return scans.map(scan => {
      // Parse JSON fields only if they are strings
      if (scan.scan_options && typeof scan.scan_options === 'string') {
        try {
          scan.scan_options = JSON.parse(scan.scan_options);
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      if (scan.results && typeof scan.results === 'string') {
        try {
          scan.results = JSON.parse(scan.results);
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      return new Scan(scan);
    });
  }

  // Get recent scans across all projects
  static async findRecent(limit = 20) {
    const result = await enhancedDb.query(`
      SELECT 
        s.*,
        p.name as project_name,
        p.path as project_path
      FROM scans s
      JOIN projects p ON p.id = s.project_id
      ORDER BY s.started_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => {
      // Parse JSON fields only if they are strings
      if (row.scan_options && typeof row.scan_options === 'string') {
        try {
          row.scan_options = JSON.parse(row.scan_options);
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      if (row.results && typeof row.results === 'string') {
        try {
          row.results = JSON.parse(row.results);
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
      
      return {
        scan: new Scan(row),
        project: {
          name: row.project_name,
          path: row.project_path
        }
      };
    });
  }

  // Update scan progress/status
  async update(updates) {
    const allowedUpdates = [
      'completed_at',
      'status', 
      'files_scanned',
      'lines_of_code',
      'conflicts_found',
      'results',
      'error_message'
    ];
    
    const updateData = {};
    
    for (const key of allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        // Stringify JSON fields
        if (key === 'results' && updates[key]) {
          updateData[key] = JSON.stringify(updates[key]);
        } else {
          updateData[key] = updates[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // If marking as completed and no completed_at time provided
    if (updates.status === 'completed' && !updates.completed_at) {
      updateData.completed_at = new Date();
    }

    const result = await enhancedDb.update('scans', updateData, 'id = $1', [this.id]);
    
    if (result) {
      // Parse JSON fields for the instance only if they are strings
      if (result.scan_options && typeof result.scan_options === 'string') {
        result.scan_options = JSON.parse(result.scan_options);
      }
      if (result.results && typeof result.results === 'string') {
        result.results = JSON.parse(result.results);
      }
      
      Object.assign(this, result);
      return this;
    }
    
    throw new Error('Scan not found');
  }

  // Mark scan as completed with results
  async complete(scanResults) {
    const {
      files = [],
      dependencies = [],
      conflicts = [],
      metrics = {},
      ...otherResults
    } = scanResults;

    try {
      // Create a clean results object without circular references
      const cleanResults = {
        summary: {
          total_files: files.length,
          total_lines: files.reduce((sum, f) => sum + (f.lines || 0), 0),
          total_conflicts: conflicts.length,
          avg_complexity: files.length > 0 ? 
            files.reduce((sum, f) => sum + (f.complexity || 0), 0) / files.length : 0
        },
        // Only include serializable properties from otherResults
        ...(otherResults.id && { id: otherResults.id }),
        ...(otherResults.timestamp && { timestamp: otherResults.timestamp }),
        ...(otherResults.scanTime && { scanTime: otherResults.scanTime }),
        ...(otherResults.rootPath && { rootPath: otherResults.rootPath })
      };

      // Save scan results and update status
      await this.update({
        status: 'completed',
        completed_at: new Date(),
        files_scanned: files.length,
        lines_of_code: files.reduce((sum, f) => sum + (f.lines || 0), 0),
        conflicts_found: conflicts.length,
        results: cleanResults
      });

      // Save detailed file data
      if (files.length > 0) {
        await this.saveFiles(files);
      }

      // Save conflicts
      if (conflicts.length > 0) {
        await this.saveConflicts(conflicts);
      }

      // Save dependencies
      if (dependencies.length > 0) {
        await this.saveDependencies(dependencies);
      }

      // Save metrics
      if (Object.keys(metrics).length > 0) {
        await this.saveMetrics(metrics);
      }

      return this;
    } catch (error) {
      console.error('Error completing scan:', error);
      // Mark scan as failed if completion fails
      await this.fail(`Failed to complete scan: ${error.message}`);
      throw error;
    }
  }

  // Mark scan as failed
  async fail(errorMessage) {
    await this.update({
      status: 'failed',
      completed_at: new Date(),
      error_message: errorMessage
    });

    return this;
  }

  // Save file details
  async saveFiles(files) {
    if (!Array.isArray(files) || files.length === 0) return;

    const values = files.map((file, index) => {
      const paramOffset = index * 6;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6})`;
    }).join(', ');

    const params = files.flatMap(file => [
      this.id,
      file.filePath || file.path,
      file.size || 0,
      file.lines || 0,
      file.complexity || 0,
      file.type || this.getFileType(file.filePath || file.path)
    ]);

    await enhancedDb.query(`
      INSERT INTO files (scan_id, file_path, file_size, lines_of_code, complexity, file_type)
      VALUES ${values}
    `, params);
  }

  // Save conflicts
  async saveConflicts(conflicts) {
    if (!Array.isArray(conflicts) || conflicts.length === 0) return;

    const values = conflicts.map((conflict, index) => {
      const paramOffset = index * 7;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5}, $${paramOffset + 6}, $${paramOffset + 7})`;
    }).join(', ');

    const params = conflicts.flatMap(conflict => [
      this.id,
      conflict.file || conflict.files?.[0] || 'unknown',
      conflict.type,
      conflict.severity || 'medium',
      conflict.line || null,
      conflict.message,
      conflict.suggestion || null
    ]);

    await enhancedDb.query(`
      INSERT INTO conflicts (scan_id, file_path, conflict_type, severity, line_number, message, suggestion)
      VALUES ${values}
    `, params);
  }

  // Save dependencies
  async saveDependencies(dependencies) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) return;

    const values = dependencies.map((dep, index) => {
      const paramOffset = index * 5;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4}, $${paramOffset + 5})`;
    }).join(', ');

    const params = dependencies.flatMap(dep => [
      this.id,
      dep.from,
      dep.to,
      dep.type || 'import',
      dep.circular || false
    ]);

    await enhancedDb.query(`
      INSERT INTO dependencies (scan_id, from_file, to_file, dependency_type, is_circular)
      VALUES ${values}
    `, params);
  }

  // Save metrics
  async saveMetrics(metrics) {
    const metricEntries = Object.entries(metrics).filter(([key, value]) => 
      value !== null && value !== undefined
    );

    if (metricEntries.length === 0) return;

    const values = metricEntries.map((entry, index) => {
      const paramOffset = index * 4;
      return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3}, $${paramOffset + 4})`;
    }).join(', ');

    const params = metricEntries.flatMap(([key, value]) => [
      this.id,
      key,
      typeof value === 'number' ? value : null,
      typeof value
    ]);

    await enhancedDb.query(`
      INSERT INTO metrics (scan_id, metric_name, metric_value, metric_type)
      VALUES ${values}
    `, params);
  }

  // Get scan duration in seconds
  getDuration() {
    if (!this.started_at) return null;
    if (!this.completed_at) return null;
    
    return Math.round((new Date(this.completed_at) - new Date(this.started_at)) / 1000);
  }

  // Helper to determine file type
  getFileType(filePath) {
    if (!filePath) return 'unknown';
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap = {
      js: 'javascript',
      jsx: 'react',
      ts: 'typescript',
      tsx: 'react-typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      rb: 'ruby',
      php: 'php'
    };
    
    return typeMap[ext] || ext || 'unknown';
  }

  // Get full scan details with related data
  async getFullDetails() {
    const [files, conflicts, dependencies, metrics] = await Promise.all([
      enhancedDb.select('files', { where: 'scan_id = $1', whereParams: [this.id] }),
      enhancedDb.select('conflicts', { where: 'scan_id = $1', whereParams: [this.id], orderBy: 'severity DESC, created_at ASC' }),
      enhancedDb.select('dependencies', { where: 'scan_id = $1', whereParams: [this.id] }),
      enhancedDb.select('metrics', { where: 'scan_id = $1', whereParams: [this.id] })
    ]);

    return {
      ...this.toJSON(),
      files,
      conflicts,
      dependencies,
      metrics,
      duration: this.getDuration()
    };
  }

  // Serialize for API response
  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      started_at: this.started_at,
      completed_at: this.completed_at,
      status: this.status,
      files_scanned: this.files_scanned,
      lines_of_code: this.lines_of_code,
      conflicts_found: this.conflicts_found,
      scan_options: this.scan_options,
      results: this.results,
      error_message: this.error_message,
      duration: this.getDuration()
    };
  }

  // Delete scan and all related data
  async delete() {
    const result = await enhancedDb.delete('scans', 'id = $1', [this.id]);
    return result.length > 0;
  }
}

export default Scan;