-- Create a more restrictive policy that properly checks authentication
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Allow super admin access to microservices" ON microservices;

-- Create policies that allow authenticated users with proper role checking
-- This uses a different approach to handle the auth.uid() issue
CREATE POLICY "Super admins can access microservices" 
ON microservices FOR ALL 
TO authenticated
USING (
  -- Check if user has super_admin role in either table
  EXISTS (
    SELECT 1 FROM platform_roles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
)
WITH CHECK (
  -- Same check for inserts/updates
  EXISTS (
    SELECT 1 FROM platform_roles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Also add a default microservice if none exists
INSERT INTO microservices (
  name, 
  display_name, 
  description, 
  base_url, 
  version, 
  status, 
  is_active
) 
SELECT 
  'api-gateway',
  'API Gateway',
  'Main API gateway service for routing requests',
  'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1',
  '1.0.0',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM microservices WHERE name = 'api-gateway'
);