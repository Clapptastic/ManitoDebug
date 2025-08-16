-- Comprehensive fix for RLS policies and authentication issues
-- First, clean up existing problematic policies for microservices
DROP POLICY IF EXISTS "Admin user can access microservices" ON microservices;
DROP POLICY IF EXISTS "Super admin access to microservices" ON microservices;

-- Create a robust super admin function that works consistently
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    ),
    false
  ) OR COALESCE(
    EXISTS (
      SELECT 1 FROM public.platform_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ),
    false
  );
$$;

-- Create new microservices policy using the robust function
CREATE POLICY "Super admins full access to microservices"
ON microservices
FOR ALL
USING (
  is_current_user_super_admin() OR 
  current_setting('role') = 'service_role'
)
WITH CHECK (
  is_current_user_super_admin() OR 
  current_setting('role') = 'service_role'
);

-- Fix other critical admin tables to use the same pattern
-- Update api_usage_costs policy
DROP POLICY IF EXISTS "Service role and admins can manage API usage costs" ON api_usage_costs;
CREATE POLICY "Super admins can manage API usage costs"
ON api_usage_costs
FOR ALL 
USING (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin() OR
  current_setting('role') = 'service_role'
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin() OR
  current_setting('role') = 'service_role'
);

-- Update documents policy
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

CREATE POLICY "Users and super admins can view documents"
ON documents
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin()
);

CREATE POLICY "Users and super admins can update documents"
ON documents  
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin()
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin()
);

CREATE POLICY "Users and super admins can delete documents"
ON documents
FOR DELETE
USING (
  (auth.uid() = user_id) OR 
  is_current_user_super_admin()
);

-- Update frontend_permissions policy
DROP POLICY IF EXISTS "Super admins full access to frontend permissions" ON frontend_permissions;
CREATE POLICY "Super admins can manage frontend permissions"
ON frontend_permissions
FOR ALL
USING (is_current_user_super_admin())
WITH CHECK (is_current_user_super_admin());

-- Update master_company_profiles policy  
DROP POLICY IF EXISTS "Super admins full access to master profiles" ON master_company_profiles;
CREATE POLICY "Super admins can manage master company profiles"
ON master_company_profiles
FOR ALL
USING (is_current_user_super_admin())
WITH CHECK (is_current_user_super_admin());

-- Test the new function
SELECT 
  auth.uid() as current_user_id,
  is_current_user_super_admin() as is_super_admin,
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin') as profile_check,
  EXISTS(SELECT 1 FROM platform_roles WHERE user_id = auth.uid() AND role = 'super_admin') as platform_check;