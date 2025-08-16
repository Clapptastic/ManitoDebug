-- Comprehensive RLS Policy Audit and Fix (Fixed Version)
-- Fix function search paths and standardize RLS policies

-- First, fix the function search path issues
ALTER FUNCTION public.check_organization_permission(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.get_user_organizations(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;

-- Fix critical RLS policy gaps and issues

-- 1. Fix tables that have nullable user_id but need RLS protection

-- admin_api_usage_tracking: Should only be accessible by super admins and service role
DROP POLICY IF EXISTS "Super admin can manage all admin API usage" ON admin_api_usage_tracking;
CREATE POLICY "Super admin can manage all admin API usage" 
ON admin_api_usage_tracking FOR ALL
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- ai_validation_logs: Users should see their own logs, admins see all
DROP POLICY IF EXISTS "Super admin can view all validation logs" ON ai_validation_logs;
DROP POLICY IF EXISTS "System can insert validation logs" ON ai_validation_logs;
CREATE POLICY "Users can view their own validation logs" 
ON ai_validation_logs FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can insert validation logs" 
ON ai_validation_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- api_metrics: Fix to ensure proper access control
DROP POLICY IF EXISTS "Super admin and service role can view all api metrics" ON api_metrics;
CREATE POLICY "Users can view their own api metrics" 
ON api_metrics FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can manage api metrics" 
ON api_metrics FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- api_usage_tracking: Fix access control
DROP POLICY IF EXISTS "Super admin can view all api usage" ON api_usage_tracking;
CREATE POLICY "Users can view their own api usage" 
ON api_usage_tracking FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can insert api usage" 
ON api_usage_tracking FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- edge_function_metrics: Fix inconsistent policies
DROP POLICY IF EXISTS "Service role can manage all function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Super admin can view function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Super admins have full access to edge_function_metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "System can insert function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Users can view their own function metrics" ON edge_function_metrics;

CREATE POLICY "Service role can manage edge function metrics" 
ON edge_function_metrics FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view edge function metrics" 
ON edge_function_metrics FOR SELECT
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- 2. Add missing RLS policies for tables that have user_id but insufficient policies

-- feature_flags: Missing proper RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feature flags" 
ON feature_flags FOR SELECT
USING (
  auth.uid() = user_id OR
  user_id IS NULL OR -- Global flags
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Admins can manage feature flags" 
ON feature_flags FOR ALL
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- 3. Fix duplicate and conflicting policies

-- company_profiles: Remove duplicate policies
DROP POLICY IF EXISTS "Service role can access company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Super admin can manage all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Super admins have full access to company_profiles" ON company_profiles;
-- Keep the individual user policies and add a consolidated admin policy
CREATE POLICY "Admins can manage all company profiles" 
ON company_profiles FOR ALL
USING (
  auth.uid() = user_id OR
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.uid() = user_id OR
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- 4. Ensure all tables with user ownership have proper DELETE policies

-- Add missing DELETE policies where needed (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_workflows' AND policyname = 'Users can delete their own automation workflows') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own automation workflows" ON automation_workflows FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_plans' AND policyname = 'Users can delete their own business plans') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own business plans" ON business_plans FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_settings' AND policyname = 'Users can delete their own chat settings') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own chat settings" ON chat_settings FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

-- 5. Fix inconsistent service role access (only if doesn't exist)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Service role full access to profiles') THEN
        EXECUTE 'CREATE POLICY "Service role full access to profiles" ON profiles FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Service role full access to user_roles') THEN
        EXECUTE 'CREATE POLICY "Service role full access to user_roles" ON user_roles FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
    END IF;
END $$;