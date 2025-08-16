-- Temporarily create a simple policy to get microservices working
-- Drop the function-based policies
DROP POLICY IF EXISTS "Super admins can view microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can insert microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can update microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can delete microservices" ON microservices;

-- Create simple policies that check the user directly
CREATE POLICY "Super admins can view microservices" 
ON microservices FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert microservices" 
ON microservices FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update microservices" 
ON microservices FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete microservices" 
ON microservices FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);