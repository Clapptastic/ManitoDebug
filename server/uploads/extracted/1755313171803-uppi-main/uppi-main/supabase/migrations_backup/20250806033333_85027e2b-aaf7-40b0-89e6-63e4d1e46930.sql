-- Fix security definer functions search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN email_to_check IN ('akclapp@gmail.com', 'samdyer27@gmail.com');
END;
$$;

-- Ensure current user has a profile (for user management to work)
INSERT INTO public.profiles (user_id, email, full_name, role, created_at, updated_at)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'Super Admin',
    'super_admin',
    NOW(),
    NOW()
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();