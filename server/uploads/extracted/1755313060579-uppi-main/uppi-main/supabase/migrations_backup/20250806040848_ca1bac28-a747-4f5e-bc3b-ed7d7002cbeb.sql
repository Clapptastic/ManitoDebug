-- Fix API Keys RLS policies for proper access control
-- The current policies are too restrictive and causing permission errors

-- Drop existing restrictive policies that are causing conflicts
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Super admin has full access to API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role has full access to API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role full access" ON api_keys;

-- Create simplified, working RLS policies for api_keys table
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all API keys"
  ON api_keys FOR ALL 
  USING (
    (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
    (get_user_role(auth.uid()) = 'super_admin') OR
    (auth.role() = 'service_role')
  );

-- Ensure service role can access for edge functions
CREATE POLICY "Service role full access on API keys"
  ON api_keys FOR ALL 
  USING (auth.role() = 'service_role');