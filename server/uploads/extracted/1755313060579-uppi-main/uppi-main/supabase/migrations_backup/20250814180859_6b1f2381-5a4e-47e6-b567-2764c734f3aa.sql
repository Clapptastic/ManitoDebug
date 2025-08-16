-- Optimize API key queries with proper indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider_active ON api_keys(user_id, provider, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_status_validation ON api_keys(status, last_validated);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- Add composite index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_timestamp ON audit_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_timestamp ON audit_logs(resource_type, created_at);

-- Add index for API usage costs
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_date ON api_usage_costs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_provider_timestamp ON api_usage_costs(provider, request_timestamp);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- Set replica identity for complete row data in realtime updates
ALTER TABLE api_keys REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;