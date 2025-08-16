-- Enable real-time updates for microservices and admin tables
ALTER TABLE microservices REPLICA IDENTITY FULL;
ALTER TABLE edge_function_metrics REPLICA IDENTITY FULL; 
ALTER TABLE api_usage_tracking REPLICA IDENTITY FULL;
ALTER TABLE admin_audit_log REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE microservices;
ALTER PUBLICATION supabase_realtime ADD TABLE edge_function_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE api_usage_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_audit_log;