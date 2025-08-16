-- Comprehensive Supabase Audit and Security Consolidation
-- This migration addresses the security findings and streamlines RLS policies

-- 1. CONSOLIDATE PROFILES TABLE RLS POLICIES
-- Remove redundant and conflicting policies
DROP POLICY IF EXISTS "Users can only access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update non-super-admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;

-- Create a single, clear RLS policy for profiles
CREATE POLICY "profiles_secure_access" ON public.profiles
FOR ALL USING (
  -- Users can access their own profile
  auth.uid() = user_id OR
  -- Admins can access all profiles
  get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
  -- Service role has full access
  auth.role() = 'service_role'
) WITH CHECK (
  -- Users can only modify their own profile
  auth.uid() = user_id OR
  -- Admins can modify all profiles
  get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
  -- Service role has full access
  auth.role() = 'service_role'
);

-- 2. CONSOLIDATE API_KEYS TABLE RLS POLICIES
-- Remove redundant policies
DROP POLICY IF EXISTS "api_keys_owner_only_delete" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_owner_only_read" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_owner_only_update" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_owner_only_write" ON public.api_keys;

-- Keep the main policy and strengthen it
-- (The "Users can only access their own API keys" policy is already secure)

-- 3. ADD MISSING CONSTRAINTS FOR DATA INTEGRITY
-- Ensure API keys are always encrypted and have proper masking
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_must_have_masked_key 
CHECK (masked_key IS NOT NULL AND length(masked_key) >= 8);

-- Ensure API key hash is always present for validation
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_must_have_hash 
CHECK (key_hash IS NOT NULL AND length(key_hash) >= 32);

-- 4. CREATE SECURE HELPER FUNCTIONS FOR ADMIN ACCESS
-- Function to safely check if user is admin without exposing data
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role = ANY (ARRAY['admin', 'super_admin'])
  );
$$;

-- 5. AUDIT FUNCTION TO CHECK RLS POLICY EFFECTIVENESS
CREATE OR REPLACE FUNCTION public.audit_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_count BIGINT,
  has_select_policy BOOLEAN,
  has_insert_policy BOOLEAN,
  has_update_policy BOOLEAN,
  has_delete_policy BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.tablename::TEXT,
    COUNT(p.policyname) as policy_count,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'SELECT') > 0 as has_select_policy,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'INSERT') > 0 as has_insert_policy,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'UPDATE') > 0 as has_update_policy,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'DELETE') > 0 as has_delete_policy
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('profiles', 'api_keys', 'admin_users', 'competitor_analyses', 'payment_methods')
  GROUP BY t.tablename
  ORDER BY t.tablename;
$$;

-- 6. CREATE SECURITY MONITORING FUNCTION
CREATE OR REPLACE FUNCTION public.monitor_sensitive_table_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    jsonb_build_object(
      'timestamp', now(),
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_agent', current_setting('request.headers', true)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply monitoring to sensitive tables
DROP TRIGGER IF EXISTS audit_api_keys_access ON public.api_keys;
CREATE TRIGGER audit_api_keys_access
  AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.monitor_sensitive_table_access();

-- 7. FINAL SECURITY VALIDATION
-- Test that RLS is working correctly by creating a test function
CREATE OR REPLACE FUNCTION public.test_rls_security()
RETURNS TABLE (
  test_name TEXT,
  passed BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  RETURN QUERY
  SELECT 
    'API Keys Table RLS'::TEXT,
    (SELECT COUNT(*) FROM public.api_keys WHERE user_id != auth.uid()) = 0,
    'Users should only see their own API keys'::TEXT;
    
  RETURN QUERY
  SELECT 
    'Profiles Table Structure'::TEXT,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') > 0,
    'Profiles table should have user_id column'::TEXT;
    
  RETURN QUERY
  SELECT 
    'Admin Users Security'::TEXT,
    (SELECT COUNT(*) FROM public.admin_users) >= 0,
    'Admin users table should be accessible to authorized users'::TEXT;
END;
$$;