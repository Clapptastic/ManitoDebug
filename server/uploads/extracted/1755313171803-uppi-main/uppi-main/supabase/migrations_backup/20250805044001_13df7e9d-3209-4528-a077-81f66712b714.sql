-- Set up super admin users in the existing system
-- The is_super_admin function already includes these emails, so we just need to update profiles

-- Update existing profiles or insert if they don't exist for super admin users
INSERT INTO public.profiles (user_id, email, role, full_name)
SELECT 
    au.id,
    au.email,
    'super_admin',
    COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
WHERE au.email IN ('akclapp@gmail.com', 'samdyer27@gmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'super_admin',
    email = EXCLUDED.email,
    updated_at = now();

-- Create admin permissions entries for these users
INSERT INTO public.admin_permissions (user_id, permission, granted_by, metadata)
SELECT 
    au.id,
    'super_admin',
    au.id, -- self-granted for initial setup
    jsonb_build_object(
        'granted_reason', 'Initial super admin setup',
        'granted_at', now()
    )
FROM auth.users au
WHERE au.email IN ('akclapp@gmail.com', 'samdyer27@gmail.com')
ON CONFLICT (user_id, permission) DO NOTHING;