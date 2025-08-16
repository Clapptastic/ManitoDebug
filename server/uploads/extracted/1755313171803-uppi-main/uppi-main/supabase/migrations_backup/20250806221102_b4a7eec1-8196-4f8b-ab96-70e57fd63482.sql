-- Update api_keys table policies to fix permission issues
DROP POLICY IF EXISTS "api_keys_service_access" ON api_keys;
DROP POLICY IF EXISTS "api_keys_user_access" ON api_keys;

-- Create more permissive policies for api_keys table
CREATE POLICY "Users can manage their own API keys" 
ON api_keys 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to API keys" 
ON api_keys 
FOR ALL 
USING (auth.role() = 'service_role');

-- Update competitor_analyses table policies to fix permission issues  
DROP POLICY IF EXISTS "competitor_analyses_service_access" ON competitor_analyses;
DROP POLICY IF EXISTS "competitor_analyses_user_access" ON competitor_analyses;

-- Create more permissive policies for competitor_analyses table
CREATE POLICY "Users can manage their own competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.role() = 'service_role');