-- Fix RLS policies for competitor analysis tables to ensure proper access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "authenticated_users_full_access_competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "service_role_full_access_competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "authenticated_users_full_access_progress" ON public.competitor_analysis_progress;
DROP POLICY IF EXISTS "service_role_full_access_progress" ON public.competitor_analysis_progress;
DROP POLICY IF EXISTS "authenticated_users_full_access_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "service_role_full_access_api_keys" ON public.api_keys;

-- Create simplified, working RLS policies for competitor_analyses
CREATE POLICY "Users can manage their own competitor analyses" 
ON public.competitor_analyses 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to competitor analyses" 
ON public.competitor_analyses 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Create simplified, working RLS policies for competitor_analysis_progress
CREATE POLICY "Users can manage their own analysis progress" 
ON public.competitor_analysis_progress 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to analysis progress" 
ON public.competitor_analysis_progress 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Create simplified, working RLS policies for api_keys
CREATE POLICY "Users can manage their own API keys" 
ON public.api_keys 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to API keys" 
ON public.api_keys 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);