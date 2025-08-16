-- Fix RLS policies to avoid user metadata security issues
-- Create secure function to check admin role

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Update platform_roles policies to use secure function
DROP POLICY IF EXISTS "Admins can manage all roles" ON platform_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON platform_roles;

CREATE POLICY "Admins can manage all roles" 
ON platform_roles 
FOR ALL 
USING (is_admin_user());

CREATE POLICY "Admins can view all roles" 
ON platform_roles 
FOR SELECT 
USING (is_admin_user());