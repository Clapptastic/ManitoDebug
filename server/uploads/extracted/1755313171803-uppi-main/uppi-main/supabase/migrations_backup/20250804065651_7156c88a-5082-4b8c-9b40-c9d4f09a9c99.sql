-- Fix RLS policies for system tables that admin dashboard needs

-- Update system_components RLS policies to allow admin access
DROP POLICY IF EXISTS "Admins can manage system components" ON system_components;
DROP POLICY IF EXISTS "Everyone can view system components" ON system_components;
DROP POLICY IF EXISTS "system_components_read_policy" ON system_components;

CREATE POLICY "Admins can manage system components" 
ON system_components 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view system components" 
ON system_components 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create system_metrics table if it doesn't exist
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

-- Enable RLS on system_metrics
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_metrics
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

CREATE POLICY "Authenticated users can view system metrics" 
ON system_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix edge_function_metrics RLS policies
DROP POLICY IF EXISTS "Users can insert their own edge function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Users can view their own edge function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "edge_function_metrics_service_access" ON edge_function_metrics;

CREATE POLICY "Users can manage their own edge function metrics" 
ON edge_function_metrics 
FOR ALL 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all edge function metrics" 
ON edge_function_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Fix type_coverage_metrics table permissions
CREATE TABLE IF NOT EXISTS type_coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  total_lines INTEGER DEFAULT 0,
  typed_lines INTEGER DEFAULT 0,
  type_coverage_percentage NUMERIC DEFAULT 0,
  any_types_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on type_coverage_metrics
ALTER TABLE type_coverage_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for type_coverage_metrics
CREATE POLICY "Admins can manage type coverage metrics" 
ON type_coverage_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Fix package_dependencies RLS policies  
DROP POLICY IF EXISTS "Admin users can manage package dependencies" ON package_dependencies;
DROP POLICY IF EXISTS "Admin users can view package dependencies" ON package_dependencies;

CREATE POLICY "Admins can manage package dependencies" 
ON package_dependencies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view package dependencies" 
ON package_dependencies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert some sample system components if none exist
INSERT INTO system_components (name, description, status, response_time, uptime_percentage) 
SELECT * FROM (
  VALUES 
    ('API Server', 'Main application API server', 'operational'::component_status, 45, 99.9),
    ('Database', 'PostgreSQL database server', 'operational'::component_status, 12, 99.8),
    ('Edge Functions', 'Supabase edge functions', 'operational'::component_status, 67, 99.5),
    ('Authentication', 'User authentication service', 'operational'::component_status, 23, 99.9),
    ('File Storage', 'Document and file storage', 'operational'::component_status, 34, 99.7)
) AS new_components(name, description, status, response_time, uptime_percentage)
WHERE NOT EXISTS (SELECT 1 FROM system_components LIMIT 1);

-- Insert sample system metrics if none exist
INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_latency, active_connections, error_rate, uptime, overall_status)
SELECT 45.2, 67.8, 34.5, 23, 156, 0.1, 99.9, 'operational'
WHERE NOT EXISTS (SELECT 1 FROM system_metrics LIMIT 1);