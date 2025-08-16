-- Production Database Optimizations for Manito
-- ===============================================

-- Enable query performance extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_active ON projects (user_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_path_hash ON projects USING hash (path);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at_desc ON projects (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_project_id_status ON scans (project_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_completed_at_desc ON scans (completed_at DESC NULLS LAST);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_id_created_at ON scans (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_files_scan_id ON scan_files (scan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_files_file_path ON scan_files USING gin (file_path gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_dependencies_scan_id ON scan_dependencies (scan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_dependencies_from_to ON scan_dependencies (from_file, to_file);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users (last_login DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions (token) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id_active ON user_sessions (user_id) WHERE expires_at > NOW();

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_recent_active ON projects (created_at DESC) 
WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_recent_completed ON scans (completed_at DESC) 
WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days';

-- Database maintenance functions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_scan_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up scan files and dependencies for scans older than 90 days
    WITH old_scans AS (
        SELECT id FROM scans 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND status IN ('completed', 'failed')
        LIMIT 1000
    )
    DELETE FROM scan_files WHERE scan_id IN (SELECT id FROM old_scans);
    
    WITH old_scans AS (
        SELECT id FROM scans 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND status IN ('completed', 'failed')
        LIMIT 1000
    )
    DELETE FROM scan_dependencies WHERE scan_id IN (SELECT id FROM old_scans);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Vacuum and analyze scheduling
-- Note: These should be run via cron or scheduled tasks, not here
-- VACUUM ANALYZE projects;
-- VACUUM ANALYZE scans;
-- VACUUM ANALYZE scan_files;
-- VACUUM ANALYZE scan_dependencies;

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    'database_size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    NOW() as measured_at
UNION ALL
SELECT 
    'total_projects' as metric,
    COUNT(*)::text as value,
    NOW() as measured_at
FROM projects WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'total_scans' as metric,
    COUNT(*)::text as value,
    NOW() as measured_at
FROM scans
UNION ALL
SELECT 
    'completed_scans_today' as metric,
    COUNT(*)::text as value,
    NOW() as measured_at
FROM scans 
WHERE status = 'completed' 
AND completed_at > CURRENT_DATE
UNION ALL
SELECT 
    'active_users_7d' as metric,
    COUNT(DISTINCT user_id)::text as value,
    NOW() as measured_at
FROM scans 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Table statistics view
CREATE OR REPLACE VIEW table_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Connection and query monitoring
CREATE OR REPLACE VIEW active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity 
WHERE state != 'idle'
ORDER BY query_start;

-- Slow query monitoring (requires pg_stat_statements)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 20;

-- Grant permissions for monitoring user (create this user in production)
-- CREATE USER manito_monitor WITH PASSWORD 'monitoring_password';
-- GRANT CONNECT ON DATABASE manito TO manito_monitor;
-- GRANT USAGE ON SCHEMA public TO manito_monitor;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO manito_monitor;
-- GRANT SELECT ON performance_summary TO manito_monitor;
-- GRANT SELECT ON table_stats TO manito_monitor;
-- GRANT SELECT ON active_connections TO manito_monitor;
-- GRANT SELECT ON slow_queries TO manito_monitor;