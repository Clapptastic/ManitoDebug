-- Make samdyer27@gmail.com a super admin
-- First, find the user and then assign the super_admin role

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user ID for the email
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'samdyer27@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email samdyer27@gmail.com not found';
    END IF;
    
    -- Insert super_admin role (or update if exists)
    INSERT INTO public.platform_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) 
    DO UPDATE SET updated_at = now();
    
    -- Also update their profile role to admin for consistency
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Successfully assigned super_admin role to user %', target_user_id;
END $$;