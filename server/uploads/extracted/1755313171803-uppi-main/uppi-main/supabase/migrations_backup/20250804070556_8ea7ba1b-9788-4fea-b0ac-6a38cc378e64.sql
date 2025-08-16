-- PRIORITY 1: Fix remaining database permission issues

-- Check if system_metrics table exists and create if not
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage NUMERIC DEFAULT 0,
  memory_usage NUMERIC DEFAULT 0,
  disk_usage NUMERIC DEFAULT 0,
  network_latency NUMERIC DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  error_rate NUMERIC DEFAULT 0,
  uptime NUMERIC DEFAULT 99.9,
  overall_status TEXT DEFAULT 'operational',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on system_metrics if not already enabled
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies for admin access consistency
DROP POLICY IF EXISTS "Admin users can manage type coverage metrics" ON type_coverage_metrics;
DROP POLICY IF EXISTS "Admin users can view type coverage metrics" ON type_coverage_metrics;

-- Ensure consistent admin policies across all tables
CREATE POLICY "Admins can view all system metrics" 
ON system_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage system metrics" 
ON system_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Insert sample system metrics if none exist
INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_latency, active_connections, error_rate, uptime, overall_status)
SELECT 45.2, 67.8, 34.5, 23, 156, 0.1, 99.9, 'operational'
WHERE NOT EXISTS (SELECT 1 FROM system_metrics LIMIT 1);