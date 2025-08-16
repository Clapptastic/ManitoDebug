-- COMPREHENSIVE PERMISSION AUDIT FIX
-- Resolves duplicates, conflicts, and missing permissions across the full stack

-- 1. STANDARDIZE RLS POLICY PATTERNS
-- Drop all existing inconsistent policies and recreate with unified naming

-- API Keys table - critical for competitor analysis
DROP POLICY IF EXISTS "authenticated_users_full_access_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "service_role_full_access_api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role has full access to API keys" ON public.api_keys;

CREATE POLICY "api_keys_user_access" 
ON public.api_keys 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_service_access" 
ON public.api_keys 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Competitor Analysis tables
DROP POLICY IF EXISTS "authenticated_users_full_access_competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "service_role_full_access_competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Service role has full access to competitor analyses" ON public.competitor_analyses;

CREATE POLICY "competitor_analyses_user_access" 
ON public.competitor_analyses 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitor_analyses_service_access" 
ON public.competitor_analyses 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Progress tracking
DROP POLICY IF EXISTS "authenticated_users_full_access_progress" ON public.competitor_analysis_progress;
DROP POLICY IF EXISTS "service_role_full_access_progress" ON public.competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can manage their own analysis progress" ON public.competitor_analysis_progress;
DROP POLICY IF EXISTS "Service role has full access to analysis progress" ON public.competitor_analysis_progress;

CREATE POLICY "competitor_progress_user_access" 
ON public.competitor_analysis_progress 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitor_progress_service_access" 
ON public.competitor_analysis_progress 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 2. FIX ADMIN ACCESS PATTERNS
-- Ensure consistent admin access across all admin tables

-- User roles table
DROP POLICY IF EXISTS "Super admin can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "user_roles_self_view" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_access" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
)
WITH CHECK (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

CREATE POLICY "user_roles_service_access" 
ON public.user_roles 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON public.profiles;

CREATE POLICY "profiles_self_access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
)
WITH CHECK (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

CREATE POLICY "profiles_service_access" 
ON public.profiles 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 3. ENSURE BUSINESS PLAN ACCESS
DROP POLICY IF EXISTS "authenticated_users_full_access_business_plans" ON public.business_plans;
DROP POLICY IF EXISTS "service_role_full_access_business_plans" ON public.business_plans;

CREATE POLICY "business_plans_user_access" 
ON public.business_plans 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_plans_service_access" 
ON public.business_plans 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 4. ENSURE DOCUMENT ACCESS
DROP POLICY IF EXISTS "authenticated_users_full_access_documents" ON public.documents;
DROP POLICY IF EXISTS "service_role_full_access_documents" ON public.documents;

CREATE POLICY "documents_user_access" 
ON public.documents 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_service_access" 
ON public.documents 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 5. CHAT SYSTEM PERMISSIONS
CREATE POLICY "chat_sessions_user_access" 
ON public.chat_sessions 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_service_access" 
ON public.chat_sessions 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 6. ENSURE METRICS ACCESS FOR ADMIN
CREATE POLICY "api_metrics_admin_view" 
ON public.api_metrics 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- 7. ENSURE APPLICATION SETTINGS ACCESS
CREATE POLICY "application_settings_user_access" 
ON public.application_settings 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_settings_service_access" 
ON public.application_settings 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);