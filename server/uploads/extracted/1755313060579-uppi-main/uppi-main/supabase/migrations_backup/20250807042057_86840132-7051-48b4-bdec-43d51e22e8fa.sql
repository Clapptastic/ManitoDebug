-- Fix function search path security warning
-- Update existing functions to have proper search_path

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_role_result TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    -- Check if super admin first
    IF public.is_super_admin(user_email) THEN
        RETURN 'super_admin';
    END IF;
    
    -- Get role from user_roles table
    SELECT role INTO user_role_result 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(user_role_result, 'user');
END;
$function$;

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