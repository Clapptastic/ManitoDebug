-- Fix microservices RLS policies to require super admin access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users" ON microservices;

-- Create proper super admin policies
CREATE POLICY "Super admins can view microservices" 
ON microservices FOR SELECT 
USING (is_super_admin_user());

CREATE POLICY "Super admins can insert microservices" 
ON microservices FOR INSERT 
WITH CHECK (is_super_admin_user());

CREATE POLICY "Super admins can update microservices" 
ON microservices FOR UPDATE 
USING (is_super_admin_user())
WITH CHECK (is_super_admin_user());

CREATE POLICY "Super admins can delete microservices" 
ON microservices FOR DELETE 
USING (is_super_admin_user());