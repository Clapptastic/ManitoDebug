-- Create a super admin role for the current user to bypass RLS restrictions
-- First, add the user to platform_roles if not already present
INSERT INTO public.platform_roles (user_id, role)
VALUES ('b4df2927-56f4-45d1-9749-6cd60f56a808', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super_admin',
  updated_at = now();

-- Also update their profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'b4df2927-56f4-45d1-9749-6cd60f56a808', 
  'akclapp@gmail.com', 
  'Andrew Clapp', 
  'super_admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = now();