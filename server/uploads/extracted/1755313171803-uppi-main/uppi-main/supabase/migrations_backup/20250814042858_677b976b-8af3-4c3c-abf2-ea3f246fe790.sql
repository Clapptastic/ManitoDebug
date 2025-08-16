-- Fix all RLS policy issues by properly recreating them
-- This addresses the "permission denied" errors in debug tests

-- 1. Fix competitor_analyses table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON competitor_analyses;
  DROP POLICY IF EXISTS "Users can insert their own competitor analyses" ON competitor_analyses;
  DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON competitor_analyses;
  DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON competitor_analyses;
  DROP POLICY IF EXISTS "competitor_analyses_select_policy" ON competitor_analyses;
  DROP POLICY IF EXISTS "competitor_analyses_insert_policy" ON competitor_analyses;
  DROP POLICY IF EXISTS "competitor_analyses_update_policy" ON competitor_analyses;
  DROP POLICY IF EXISTS "competitor_analyses_delete_policy" ON competitor_analyses;
  
  -- Create new comprehensive policies
  CREATE POLICY "allow_authenticated_select" ON competitor_analyses
    FOR SELECT USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "allow_authenticated_insert" ON competitor_analyses
    FOR INSERT WITH CHECK (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "allow_authenticated_update" ON competitor_analyses
    FOR UPDATE USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "allow_authenticated_delete" ON competitor_analyses
    FOR DELETE USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
END $$;

-- 2. Fix api_keys table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "api_keys_select_policy" ON api_keys;
  DROP POLICY IF EXISTS "api_keys_insert_policy" ON api_keys;
  DROP POLICY IF EXISTS "api_keys_update_policy" ON api_keys;
  DROP POLICY IF EXISTS "api_keys_delete_policy" ON api_keys;
  
  -- Create new API keys policies
  CREATE POLICY "api_keys_select" ON api_keys
    FOR SELECT USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "api_keys_insert" ON api_keys
    FOR INSERT WITH CHECK (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "api_keys_update" ON api_keys
    FOR UPDATE USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
    
  CREATE POLICY "api_keys_delete" ON api_keys
    FOR DELETE USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
END $$;

-- 3. Ensure RLS is enabled on critical tables
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;