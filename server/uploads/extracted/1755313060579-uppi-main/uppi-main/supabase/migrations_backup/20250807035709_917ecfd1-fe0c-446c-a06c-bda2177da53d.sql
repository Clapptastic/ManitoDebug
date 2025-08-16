-- Fix competitor_analyses RLS policies and data access issues

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Service role full access to competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;

-- Create proper RLS policies
CREATE POLICY "Users can manage their own competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;