-- First, drop ALL existing problematic policies for both tables
DROP POLICY IF EXISTS "authenticated_users_select_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_insert_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_update_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_delete_own_analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Service role has full access to competitor analyses" ON competitor_analyses;

DROP POLICY IF EXISTS "authenticated_users_select_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_insert_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_update_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_delete_own_progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can view their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can create their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can update their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can delete their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Service role has full access to competitor analysis progress" ON competitor_analysis_progress;

-- Now create clean, working policies
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

CREATE POLICY "Service role has full access to competitor analyses"
ON competitor_analyses FOR ALL
USING (auth.role() = 'service_role');

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

CREATE POLICY "Service role has full access to competitor analysis progress"
ON competitor_analysis_progress FOR ALL
USING (auth.role() = 'service_role');