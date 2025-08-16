-- Fix RLS policies for competitor_analyses table to ensure proper authentication
-- Drop existing problematic policies
DROP POLICY IF EXISTS "authenticated_users_select_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_insert_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_update_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_delete_own_analyses" ON competitor_analyses;

-- Create new, more permissive policies that work correctly
CREATE POLICY "Users can view their own competitor analyses"
ON competitor_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor analyses"
ON competitor_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analyses"
ON competitor_analyses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analyses"
ON competitor_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Ensure service role has full access
CREATE POLICY "Service role has full access to competitor analyses"
ON competitor_analyses FOR ALL
USING (auth.role() = 'service_role');

-- Fix RLS policies for competitor_analysis_progress table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "authenticated_users_select_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_insert_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_update_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_delete_own_progress" ON competitor_analysis_progress;

-- Create new policies for progress table
CREATE POLICY "Users can view their own analysis progress"
ON competitor_analysis_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis progress"
ON competitor_analysis_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis progress"
ON competitor_analysis_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis progress"
ON competitor_analysis_progress FOR DELETE
USING (auth.uid() = user_id);

-- Ensure service role has full access to progress table
CREATE POLICY "Service role has full access to competitor analysis progress"
ON competitor_analysis_progress FOR ALL
USING (auth.role() = 'service_role');