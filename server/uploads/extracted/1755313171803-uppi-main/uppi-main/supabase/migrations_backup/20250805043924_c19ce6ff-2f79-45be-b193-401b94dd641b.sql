-- Ensure super admin users are properly set up in the system

-- First, let's update the profiles table to set the role for these users
-- We'll use email to identify them since that's what the is_super_admin function checks

-- Update existing profiles or insert if they don't exist
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

-- Also add entries to user_roles table if it exists and the role enum supports super_admin
-- First check if we need to add super_admin to the app_role enum
DO $$ 
BEGIN
    -- Try to add super_admin to the enum if it doesn't exist
    BEGIN
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
    EXCEPTION WHEN OTHERS THEN
        -- If enum doesn't exist or other error, continue
        NULL;
    END;
END $$;

-- Now insert into user_roles if the table exists
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id,
    'super_admin'::public.app_role
FROM auth.users au
WHERE au.email IN ('akclapp@gmail.com', 'samdyer27@gmail.com')
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create admin permissions entries
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