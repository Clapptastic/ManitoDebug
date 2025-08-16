-- Clean up conflicting microservices RLS policies
DROP POLICY IF EXISTS "Authenticated users can manage microservices" ON microservices;

-- Ensure we have the proper super admin policies only
DROP POLICY IF EXISTS "Super admins can view all microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can insert microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can update microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can delete microservices" ON microservices;

-- Recreate clean policies for super admins only
CREATE POLICY "Super admins can view all microservices" 
ON microservices FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admins can insert microservices" 
ON microservices FOR INSERT 
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update microservices" 
ON microservices FOR UPDATE 
USING (is_super_admin());

CREATE POLICY "Super admins can delete microservices" 
ON microservices FOR DELETE 
USING (is_super_admin());