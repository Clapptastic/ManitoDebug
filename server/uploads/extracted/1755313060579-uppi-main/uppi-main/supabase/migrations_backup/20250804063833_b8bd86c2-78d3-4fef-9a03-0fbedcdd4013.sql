-- Create security definer functions to check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Update master_company_profiles RLS policy to use security definer function
DROP POLICY IF EXISTS "Only super admins can access master company profiles" ON master_company_profiles;

CREATE POLICY "Super admins can access master company profiles"
ON master_company_profiles
FOR ALL
TO authenticated
USING (public.is_super_admin_user());

-- Update frontend_permissions RLS policy
DROP POLICY IF EXISTS "Only super admins can manage frontend permissions" ON frontend_permissions;

CREATE POLICY "Super admins can manage frontend permissions"
ON frontend_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin_user());

-- Update confidence_history RLS policy
DROP POLICY IF EXISTS "Only super admins can view confidence history" ON confidence_history;

CREATE POLICY "Super admins can view confidence history"
ON confidence_history
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());

-- Update data_validation_logs RLS policy
DROP POLICY IF EXISTS "Only super admins can view validation logs" ON data_validation_logs;

CREATE POLICY "Super admins can view validation logs"
ON data_validation_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());

-- Update company_profile_merges RLS policy
DROP POLICY IF EXISTS "Only super admins can view merge history" ON company_profile_merges;

CREATE POLICY "Super admins can view merge history"
ON company_profile_merges
FOR SELECT
TO authenticated
USING (public.is_super_admin_user());