-- Fix infinite recursion in platform_roles policies
-- Remove the recursive policies and create safe ones

DROP POLICY IF EXISTS "Super admins can manage all roles" ON platform_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON platform_roles;

-- Create non-recursive policies using auth.jwt() metadata
CREATE POLICY "Admins can manage all roles" 
ON platform_roles 
FOR ALL 
USING (
  (auth.jwt()->>'role')::text = 'admin' OR 
  (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
);

CREATE POLICY "Admins can view all roles" 
ON platform_roles 
FOR SELECT 
USING (
  (auth.jwt()->>'role')::text = 'admin' OR 
  (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
);