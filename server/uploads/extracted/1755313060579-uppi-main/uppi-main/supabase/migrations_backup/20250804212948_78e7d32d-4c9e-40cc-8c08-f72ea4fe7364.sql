-- Test and fix the is_super_admin function by checking what's happening
-- First, let's see what auth.uid() returns in the current context
SELECT auth.uid();

-- Check if the function works correctly
-- Let's also add some debugging to understand what's happening
CREATE OR REPLACE FUNCTION public.debug_super_admin_check()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'platform_roles_exists', EXISTS(SELECT 1 FROM platform_roles WHERE user_id = auth.uid() AND role = 'super_admin'),
    'profiles_exists', EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'),
    'is_super_admin_result', is_super_admin()
  );
$$;

-- Also let's check the exact policies on microservices
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'microservices';