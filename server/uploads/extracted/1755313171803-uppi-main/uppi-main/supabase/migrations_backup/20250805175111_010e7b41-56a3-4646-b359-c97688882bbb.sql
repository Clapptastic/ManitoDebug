-- Fix RLS policies for admin tables that are missing policies

-- Enable RLS policies for profiles table (used by admin-api)
CREATE POLICY "Admin can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    -- Allow if user is admin/super_admin
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR
    -- Allow users to manage their own profile
    user_id = auth.uid()
  );

-- Enable RLS policies for user_roles table  
CREATE POLICY "Admin can manage user roles" ON user_roles
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable RLS policies for competitor_analyses table
CREATE POLICY "Users can manage their competitor analyses" ON competitor_analyses
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable RLS policies for documents table
CREATE POLICY "Users can manage their documents" ON documents
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable RLS policies for documentation table
CREATE POLICY "Admin can manage documentation" ON documentation
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Add missing data_completeness_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='competitor_analyses' AND column_name='data_completeness_score') THEN
        ALTER TABLE competitor_analyses ADD COLUMN data_completeness_score DECIMAL(3,2) DEFAULT 0.0;
    END IF;
END $$;

-- Create api_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on api_metrics
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for api_metrics
CREATE POLICY "Admin can view api metrics" ON api_metrics
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Fix api_usage_costs table to have proper timestamp column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='api_usage_costs' AND column_name='request_timestamp') THEN
        ALTER TABLE api_usage_costs ADD COLUMN request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;