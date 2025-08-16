-- Drop the existing function first, then recreate it properly
DROP FUNCTION IF EXISTS public.secure_api_key_access(uuid, text);

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