-- Fix microservices RLS policies to handle authentication context properly
-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage microservices" ON microservices;
DROP POLICY IF EXISTS "Service role bypass for microservices" ON microservices;

-- Create improved super admin function that works with different auth contexts
CREATE OR REPLACE FUNCTION public.is_super_admin_user_improved()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT COALESCE(
    (EXISTS (
      SELECT 1 FROM public.platform_roles 
      WHERE user_id = auth.uid() 
      AND role::text = 'super_admin'
    )),
    false
  ) OR COALESCE(
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role::text = 'super_admin'
    )),
    false
  ) OR 
  -- Check if user is authenticated and has super admin metadata
  COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin',
    false
  ) OR
  COALESCE(
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super_admin', 
    false
  );
$$;

-- Create new policies with improved function
CREATE POLICY "Super admins can manage microservices" 
ON microservices 
FOR ALL 
USING (is_super_admin_user_improved())
WITH CHECK (is_super_admin_user_improved());

-- Service role bypass policy  
CREATE POLICY "Service role bypass for microservices"
ON microservices
FOR ALL
USING (
  (current_setting('role') = 'service_role') OR 
  ((auth.jwt() ->> 'role') = 'service_role') OR
  (current_user = 'service_role')
)
WITH CHECK (
  (current_setting('role') = 'service_role') OR 
  ((auth.jwt() ->> 'role') = 'service_role') OR
  (current_user = 'service_role')
);

-- Test the new function
SELECT 
  auth.uid() as current_user_id,
  is_super_admin_user_improved() as improved_check,
  is_super_admin_user() as original_check;