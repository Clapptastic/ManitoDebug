-- Drop all policies that depend on the function first
DROP POLICY IF EXISTS "Super admins can access master company profiles" ON master_company_profiles;
DROP POLICY IF EXISTS "Super admins can manage frontend permissions" ON frontend_permissions;
DROP POLICY IF EXISTS "Super admins can view confidence history" ON confidence_history;
DROP POLICY IF EXISTS "Super admins can view validation logs" ON data_validation_logs;
DROP POLICY IF EXISTS "Super admins can view merge history" ON company_profile_merges;

-- Now drop and recreate the function
DROP FUNCTION IF EXISTS public.is_super_admin_user();

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_user() TO anon;

-- Recreate policies with the updated function
CREATE POLICY "Super admins full access to master profiles"
ON master_company_profiles
FOR ALL
TO authenticated
USING (public.is_super_admin_user())
WITH CHECK (public.is_super_admin_user());

CREATE POLICY "Super admins full access to frontend permissions"
ON frontend_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin_user())
WITH CHECK (public.is_super_admin_user());

CREATE POLICY "Super admins can read confidence history"
ON confidence_history
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());

CREATE POLICY "Super admins can read validation logs"
ON data_validation_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());

CREATE POLICY "Super admins can read merge history"
ON company_profile_merges
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());