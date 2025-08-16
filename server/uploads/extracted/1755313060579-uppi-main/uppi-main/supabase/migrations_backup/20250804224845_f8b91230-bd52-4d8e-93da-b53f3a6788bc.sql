-- Create a simple RLS policy that checks JWT metadata directly
-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage microservices" ON microservices;
DROP POLICY IF EXISTS "Service role bypass for microservices" ON microservices;

-- Create a policy that directly checks the JWT token for super admin role
CREATE POLICY "Super admin access to microservices"
ON microservices
FOR ALL
USING (
  -- Check if user has super_admin role in app_metadata
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  -- Check if user has super_admin role in user_metadata  
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin' OR
  -- Service role bypass
  (auth.jwt() ->> 'role') = 'service_role' OR
  current_setting('role') = 'service_role'
)
WITH CHECK (
  -- Check if user has super_admin role in app_metadata
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin' OR
  -- Check if user has super_admin role in user_metadata
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin' OR
  -- Service role bypass
  (auth.jwt() ->> 'role') = 'service_role' OR
  current_setting('role') = 'service_role'
);

-- Test what's in the JWT token for the current user
SELECT 
  auth.jwt() ->> 'email' as email,
  auth.jwt() ->> 'app_metadata' as app_metadata,
  auth.jwt() ->> 'user_metadata' as user_metadata,
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' as app_role,
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' as user_role;