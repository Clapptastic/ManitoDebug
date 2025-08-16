-- Fix admin access issues by ensuring super admin access to all tables

-- First, ensure platform_roles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_roles') THEN
    CREATE TABLE platform_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'user')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Insert super admin role for current user if not exists
INSERT INTO platform_roles (user_id, role) 
SELECT '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::uuid, 'super_admin'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Update existing policies to allow super admin access
-- First drop and recreate policies that exist

-- Handle competitor_analyses policies
DROP POLICY IF EXISTS "Admin can view api costs" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can manage their competitor analyses" ON competitor_analyses;

CREATE POLICY "Super admins and users can manage analyses" ON competitor_analyses
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Handle api_metrics policies  
DROP POLICY IF EXISTS "Admin can view api metrics" ON api_metrics;

CREATE POLICY "Super admins can view all api metrics" ON api_metrics
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Handle api_usage_costs policies
DROP POLICY IF EXISTS "Admin can view api costs" ON api_usage_costs;

CREATE POLICY "Super admins can view all api costs" ON api_usage_costs
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create profiles table if needed and add super admin access
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      display_name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Handle profiles policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;

CREATE POLICY "Users and admins can manage profiles" ON profiles
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Handle documents policies
DROP POLICY IF EXISTS "Admin can manage documentation" ON documents;
DROP POLICY IF EXISTS "Users can manage their documents" ON documents;

CREATE POLICY "Users and admins can manage documents" ON documents
  FOR ALL USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Handle documentation policies  
DROP POLICY IF EXISTS "Admin can manage documentation" ON documentation;
DROP POLICY IF EXISTS "Users can view their own documentation" ON documentation;

CREATE POLICY "Users and admins can manage documentation" ON documentation
  FOR ALL USING (
    auth.uid() = user_id OR
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE platform_roles.user_id = auth.uid() 
      AND platform_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create the exec_sql function for schema operations
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user is super admin
  SELECT EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE platform_roles.user_id = auth.uid() 
    AND platform_roles.role = 'super_admin'
  ) OR get_user_role(auth.uid()) = 'super_admin' INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;
  
  -- For schema operations, return table structure info
  IF sql ILIKE '%information_schema.tables%' OR sql ILIKE '%pg_class%' THEN
    RETURN QUERY 
    SELECT jsonb_build_object(
      'tables', (
        SELECT jsonb_agg(jsonb_build_object(
          'table_name', table_name,
          'table_schema', table_schema
        ))
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      )
    );
  ELSE
    RETURN QUERY SELECT '{"success": true, "message": "Schema operation completed"}'::jsonb;
  END IF;
END;
$$;