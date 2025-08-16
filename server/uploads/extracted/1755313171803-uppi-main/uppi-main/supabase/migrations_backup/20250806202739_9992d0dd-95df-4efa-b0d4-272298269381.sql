-- Fix RLS policies for competitor_analyses table to ensure proper access
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Service role has full access to competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "service_role_full_access_analyses" ON competitor_analyses;

-- Create comprehensive RLS policies for competitor_analyses
CREATE POLICY "Enable all access for service role" ON competitor_analyses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own analyses" ON competitor_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON competitor_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON competitor_analyses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON competitor_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Fix RLS policies for competitor_analysis_progress table
DROP POLICY IF EXISTS "Users can create their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can delete their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can insert their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can update their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can view their own analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Service role has full access to competitor analysis progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "service_role_full_access_progress" ON competitor_analysis_progress;

-- Create comprehensive RLS policies for competitor_analysis_progress
CREATE POLICY "Enable all access for service role on progress" ON competitor_analysis_progress
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own progress" ON competitor_analysis_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON competitor_analysis_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON competitor_analysis_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON competitor_analysis_progress
  FOR DELETE USING (auth.uid() = user_id);