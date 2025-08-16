-- Fix RLS policies for competitor_analyses table
-- Current error: "permission denied for table competitor_analyses"

-- First, check if policies exist and update them to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can access their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can insert their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON competitor_analyses;

-- Create comprehensive RLS policies for competitor_analyses
CREATE POLICY "Users can view their own competitor analyses"
ON competitor_analyses FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can insert their own competitor analyses"
ON competitor_analyses FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can update their own competitor analyses"
ON competitor_analyses FOR UPDATE
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can delete their own competitor analyses"
ON competitor_analyses FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

-- Fix API keys table policies to allow proper access
DROP POLICY IF EXISTS "Users can access their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own api keys" ON api_keys;

-- Create API keys policies
CREATE POLICY "Users can view their own API keys"
ON api_keys FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can insert their own API keys"
ON api_keys FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can update their own API keys"
ON api_keys FOR UPDATE
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Users can delete their own API keys"
ON api_keys FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

-- Fix user_provider_costs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_provider_costs') THEN
    DROP POLICY IF EXISTS "Users can view their own provider costs" ON user_provider_costs;
    CREATE POLICY "Users can view their own provider costs"
    ON user_provider_costs FOR SELECT
    USING (
      auth.uid() = user_id OR 
      public.is_admin_user(auth.uid()) OR
      auth.role() = 'service_role'
    );
  END IF;
END $$;