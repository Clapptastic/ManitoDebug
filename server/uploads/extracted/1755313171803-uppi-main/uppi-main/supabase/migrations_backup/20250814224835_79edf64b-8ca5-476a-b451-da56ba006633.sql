-- Fix remaining search_path security issues
-- Update all remaining functions to have proper search_path

-- Check and update any other functions that might need search_path
CREATE OR REPLACE FUNCTION public.secure_api_key_access(user_id_target uuid, operation_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow users to access their own API keys
  IF auth.uid() = user_id_target THEN
    RETURN true;
  END IF;
  
  -- Allow service role
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;
  
  -- Allow admins for read operations
  IF operation_type = 'read' AND get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;