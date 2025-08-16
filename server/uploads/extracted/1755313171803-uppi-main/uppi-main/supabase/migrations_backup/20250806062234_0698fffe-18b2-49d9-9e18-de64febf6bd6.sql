-- Create proper unique constraint for user_roles table and set up super admin users
-- First add unique constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_roles_user_role_unique' 
        AND table_name = 'user_roles'
    ) THEN
        -- Add unique constraint
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);
    END IF;
END $$;

-- Now ensure the specified users have super admin roles
DO $$
DECLARE
    akclapp_user_id uuid;
    samdyer_user_id uuid;
BEGIN
    -- Get user IDs for the specified emails
    SELECT id INTO akclapp_user_id FROM auth.users WHERE email = 'akclapp@gmail.com';
    SELECT id INTO samdyer_user_id FROM auth.users WHERE email = 'samdyer27@gmail.com';
    
    -- Update akclapp@gmail.com to super_admin if user exists
    IF akclapp_user_id IS NOT NULL THEN
        -- First, deactivate all existing roles for this user
        UPDATE public.user_roles 
        SET is_active = false 
        WHERE user_id = akclapp_user_id;
        
        -- Insert or update super_admin role
        INSERT INTO public.user_roles (user_id, role, is_active, assigned_at)
        VALUES (akclapp_user_id, 'super_admin', true, now())
        ON CONFLICT (user_id, role) DO UPDATE SET 
            is_active = true,
            assigned_at = now();
            
        -- Update profile role
        UPDATE public.profiles 
        SET role = 'super_admin' 
        WHERE user_id = akclapp_user_id;
    END IF;
    
    -- Update samdyer27@gmail.com to super_admin if user exists
    IF samdyer_user_id IS NOT NULL THEN
        -- First, deactivate all existing roles for this user
        UPDATE public.user_roles 
        SET is_active = false 
        WHERE user_id = samdyer_user_id;
        
        -- Insert or update super_admin role
        INSERT INTO public.user_roles (user_id, role, is_active, assigned_at)
        VALUES (samdyer_user_id, 'super_admin', true, now())
        ON CONFLICT (user_id, role) DO UPDATE SET 
            is_active = true,
            assigned_at = now();
            
        -- Update profile role
        UPDATE public.profiles 
        SET role = 'super_admin' 
        WHERE user_id = samdyer_user_id;
    END IF;
END $$;