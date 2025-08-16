-- Fix the RLS policy by removing user metadata references (security issue)
-- and create a simpler policy based on database roles

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admin access to microservices" ON microservices;

-- Create a simple policy that works with the database directly
CREATE POLICY "Super admins can manage microservices"
ON microservices
FOR ALL
USING (
  -- Direct database role check without functions
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  ) OR
  -- Service role bypass
  current_setting('role') = 'service_role'
)
WITH CHECK (
  -- Direct database role check without functions  
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  ) OR
  -- Service role bypass
  current_setting('role') = 'service_role'
);

-- Create a function to update user's auth metadata to match their profile role
CREATE OR REPLACE FUNCTION public.sync_user_auth_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Update auth metadata for users with super_admin role in profiles
    FOR user_record IN 
        SELECT p.id, p.role 
        FROM profiles p 
        WHERE p.role = 'super_admin'
    LOOP
        -- Update the user's auth metadata
        UPDATE auth.users 
        SET 
            app_metadata = COALESCE(app_metadata, '{}'::jsonb) || 
                          jsonb_build_object('role', user_record.role),
            user_metadata = COALESCE(user_metadata, '{}'::jsonb) || 
                           jsonb_build_object('role', user_record.role)
        WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- Run the sync function to update metadata
SELECT sync_user_auth_metadata();

-- Check if the akclapp@gmail.com user now has proper metadata
SELECT 
    u.email,
    u.app_metadata,
    u.user_metadata,
    p.role as profile_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'akclapp@gmail.com';