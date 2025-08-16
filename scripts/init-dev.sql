-- Development Database Initialization Script for ManitoDebug
-- This script sets up the development database with sample data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create development schemas
CREATE SCHEMA IF NOT EXISTS manito_dev;
SET search_path TO manito_dev, public;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    scan_status VARCHAR(50) DEFAULT 'pending',
    UNIQUE(user_id, path)
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'running',
    files_scanned INTEGER DEFAULT 0,
    lines_of_code INTEGER DEFAULT 0,
    conflicts_found INTEGER DEFAULT 0,
    scan_options JSONB,
    results JSONB,
    error_message TEXT
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    lines_of_code INTEGER,
    complexity INTEGER,
    file_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hash VARCHAR(64)
);

-- Conflicts table
CREATE TABLE IF NOT EXISTS conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    conflict_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    line_number INTEGER,
    column_number INTEGER,
    message TEXT NOT NULL,
    suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    from_file TEXT NOT NULL,
    to_file TEXT NOT NULL,
    dependency_type VARCHAR(50),
    is_circular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_type VARCHAR(50),
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache table for performance
CREATE TABLE IF NOT EXISTS cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_files_scan_id ON files(scan_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files USING gin(file_path gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_conflicts_scan_id ON conflicts(scan_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_dependencies_scan_id ON dependencies(scan_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_circular ON dependencies(is_circular);
CREATE INDEX IF NOT EXISTS idx_metrics_scan_id ON metrics(scan_id);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample development data
INSERT INTO projects (name, path, description) VALUES
    ('Sample React App', '/app/samples/react-app', 'A sample React application for testing'),
    ('Node.js API', '/app/samples/node-api', 'Sample Node.js REST API'),
    ('ManitoDebug Self', '/app', 'Self-analysis of the ManitoDebug application')
ON CONFLICT (path) DO NOTHING;

-- Insert sample scan data
WITH sample_project AS (
    SELECT id FROM projects WHERE path = '/app' LIMIT 1
),
sample_scan AS (
    INSERT INTO scans (project_id, completed_at, status, files_scanned, lines_of_code, conflicts_found, results)
    SELECT 
        sp.id,
        NOW() - INTERVAL '1 hour',
        'completed',
        42,
        1337,
        3,
        '{"summary": "Sample scan results", "health_score": 85}'
    FROM sample_project sp
    RETURNING id
)
INSERT INTO conflicts (scan_id, file_path, conflict_type, severity, line_number, message, suggestion)
SELECT 
    ss.id,
    'client/src/components/Header.jsx',
    'unused-variable',
    'warning',
    23,
    'Variable "isConnected" is declared but never used',
    'Remove the unused variable or use it in the component'
FROM sample_scan ss
UNION ALL
SELECT 
    ss.id,
    'server/routes/api.js',
    'potential-security-issue',
    'high',
    45,
    'Direct use of user input in query without sanitization',
    'Use parameterized queries or input validation'
FROM sample_scan ss
UNION ALL
SELECT 
    ss.id,
    'core/scanner.js',
    'complexity-warning',
    'medium',
    123,
    'Function complexity is high (12), consider refactoring',
    'Break down the function into smaller, more focused functions'
FROM sample_scan ss;

-- Create views for common queries
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.path,
    p.last_scanned_at,
    p.scan_status,
    s.files_scanned,
    s.lines_of_code,
    s.conflicts_found,
    COALESCE(s.results->>'health_score', '0')::INTEGER as health_score
FROM projects p
LEFT JOIN scans s ON s.project_id = p.id AND s.status = 'completed'
WHERE s.id = (
    SELECT id FROM scans 
    WHERE project_id = p.id AND status = 'completed'
    ORDER BY completed_at DESC 
    LIMIT 1
);

CREATE OR REPLACE VIEW recent_scans AS
SELECT 
    s.id,
    p.name as project_name,
    s.started_at,
    s.completed_at,
    s.status,
    s.files_scanned,
    s.conflicts_found,
    EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) as duration_seconds
FROM scans s
JOIN projects p ON p.id = s.project_id
ORDER BY s.started_at DESC
LIMIT 50;

-- Grant permissions for development user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA manito_dev TO manito_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA manito_dev TO manito_dev;
GRANT USAGE ON SCHEMA manito_dev TO manito_dev;

-- Clean up expired cache entries function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'ManitoDebug development database initialized successfully';
    RAISE NOTICE 'Schema: manito_dev';
    RAISE NOTICE 'Sample data inserted';
    RAISE NOTICE 'Views and functions created';
END $$;