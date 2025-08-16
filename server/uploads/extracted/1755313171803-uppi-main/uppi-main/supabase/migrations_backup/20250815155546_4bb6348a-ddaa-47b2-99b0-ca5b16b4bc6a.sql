-- Fix missing get_user_role function that's being used in many RLS policies
-- This function is referenced but might not exist properly

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  target_user_id uuid;
BEGIN
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check admin_users table first (for super_admin)
  SELECT role INTO user_role
  FROM public.admin_users
  WHERE email = (
    SELECT email FROM auth.users WHERE id = target_user_id
  ) AND is_active = true
  LIMIT 1;
  
  -- If found in admin_users, return that role
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Otherwise check profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = target_user_id
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Fix missing is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  user_role text;
BEGIN
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  user_role := get_user_role(target_user_id);
  
  RETURN user_role = ANY (ARRAY['admin', 'super_admin']);
END;
$$;

-- Fix missing secure_api_key_access function used in api_keys RLS
CREATE OR REPLACE FUNCTION public.secure_api_key_access(key_user_id uuid, access_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Service role has full access
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;
  
  -- Admins have full access
  IF is_admin_user(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Users can only access their own keys
  IF auth.uid() = key_user_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;