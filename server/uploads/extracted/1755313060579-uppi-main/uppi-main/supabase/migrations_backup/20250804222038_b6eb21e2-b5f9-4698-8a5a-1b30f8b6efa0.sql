-- Ensure super admin privileges for specified users
-- First, make sure these users exist in profiles table
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
VALUES 
  ('b4df2927-56f4-45d1-9749-6cd60f56a808', 'akclapp@gmail.com', 'super_admin', 'AKC Lapp', now(), now()),
  ('70ae2486-1c6f-4239-b728-b6e7208fee66', 'samdyer27@gmail.com', 'super_admin', 'Sam Dyer', now(), now())
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  email = EXCLUDED.email,
  updated_at = now();

-- Ensure they also exist in platform_roles table
INSERT INTO platform_roles (user_id, role, created_at, updated_at)
VALUES 
  ('b4df2927-56f4-45d1-9749-6cd60f56a808', 'super_admin', now(), now()),
  ('70ae2486-1c6f-4239-b728-b6e7208fee66', 'super_admin', now(), now())
ON CONFLICT (user_id, role) DO UPDATE SET
  updated_at = now();

-- Create a function to check super admin status for specific user
CREATE OR REPLACE FUNCTION public.check_user_super_admin_status(user_email text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT jsonb_build_object(
    'email', user_email,
    'user_id', u.id,
    'profile_role', p.role,
    'platform_role', pr.role,
    'is_super_admin_via_profile', EXISTS(SELECT 1 FROM profiles WHERE id = u.id AND role = 'super_admin'),
    'is_super_admin_via_platform', EXISTS(SELECT 1 FROM platform_roles WHERE user_id = u.id AND role = 'super_admin')
  )
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN platform_roles pr ON u.id = pr.user_id
  WHERE u.email = user_email;
$$;