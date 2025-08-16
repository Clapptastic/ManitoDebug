-- Fix RLS policies for api_keys table to properly allow user access
-- The issue is that the policies are too restrictive and causing permission errors

-- Drop the overly complex policies and create simpler, more effective ones
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

-- Create simplified, working RLS policies
CREATE POLICY "Users can manage their own API keys" 
ON api_keys FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Keep service role access for edge functions
CREATE POLICY "Service role has full access to API keys" 
ON api_keys FOR ALL 
USING (auth.role() = 'service_role');

-- Keep super admin access but simplified
CREATE POLICY "Super admin has full access to API keys" 
ON api_keys FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = 'super_admin'
);