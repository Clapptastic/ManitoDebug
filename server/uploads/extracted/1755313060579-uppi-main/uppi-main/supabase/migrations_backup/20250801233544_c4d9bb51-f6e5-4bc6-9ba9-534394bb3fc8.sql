-- Fix RLS policies for critical tables

-- Update competitor_analyses policies to allow user access
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;
CREATE POLICY "Users can manage their own competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update api_keys policies to allow user access  
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
CREATE POLICY "Users can manage their own API keys"
ON api_keys
FOR ALL
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Update system_components to allow authenticated users to read
DROP POLICY IF EXISTS "Everyone can view system components" ON system_components;
CREATE POLICY "Everyone can view system components"
ON system_components
FOR SELECT
TO authenticated
USING (true);

-- Update documentation policies for authenticated users
DROP POLICY IF EXISTS "Users can view published documentation" ON documentation;
CREATE POLICY "Users can view published documentation"
ON documentation  
FOR SELECT
TO authenticated
USING (is_published = true);