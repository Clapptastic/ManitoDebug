-- First, let's get the user ID for akclapp@gmail.com and insert the super_admin role
INSERT INTO platform_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users 
WHERE email = 'akclapp@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;