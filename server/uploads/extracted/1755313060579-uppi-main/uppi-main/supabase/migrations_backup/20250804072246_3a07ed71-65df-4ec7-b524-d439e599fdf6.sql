-- Fix missing RLS policies for admin tables that are causing permission denied errors

-- Fix type_coverage_metrics table policies
CREATE POLICY "Super admins can manage type coverage metrics" 
ON type_coverage_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Fix system_components table policies (already exists but add backup)
CREATE POLICY "Service role can manage system components" 
ON system_components 
FOR ALL 
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  (current_setting('role'::text) = 'service_role'::text)
);

-- Fix edge_function_metrics table policies (already exists but add backup)  
CREATE POLICY "Service role can manage edge function metrics"
ON edge_function_metrics
FOR ALL
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  (current_setting('role'::text) = 'service_role'::text)
);

-- Create missing type_coverage_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS type_coverage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  total_lines integer NOT NULL DEFAULT 0,
  typed_lines integer NOT NULL DEFAULT 0,
  type_coverage_percentage numeric NOT NULL DEFAULT 0,
  any_types_count integer NOT NULL DEFAULT 0,
  errors_count integer NOT NULL DEFAULT 0,
  warnings_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on type_coverage_metrics
ALTER TABLE type_coverage_metrics ENABLE ROW LEVEL SECURITY;