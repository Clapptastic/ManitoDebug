-- Update hardcoded super admin emails in the database function
CREATE OR REPLACE FUNCTION public.is_super_admin(email_to_check text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN email_to_check IN ('akclapp@gmail.com', 'samdyer27@gmail.com');
END;
$function$;

-- Ensure the specified users have super admin roles in user_roles table
-- First, check if these users exist and update their roles
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
        -- Deactivate existing roles
        UPDATE public.user_roles 
        SET is_active = false 
        WHERE user_id = akclapp_user_id;
        
        -- Insert super_admin role
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
        -- Deactivate existing roles
        UPDATE public.user_roles 
        SET is_active = false 
        WHERE user_id = samdyer_user_id;
        
        -- Insert super_admin role
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