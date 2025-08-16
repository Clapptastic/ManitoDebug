-- Fix remaining search path security warnings

-- Fix function search paths for security compliance
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = user_id_param
  AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$function$;

CREATE OR REPLACE FUNCTION public.secure_api_key_access(user_id_param uuid, operation_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to access their own API keys
  RETURN (auth.uid() = user_id_param) OR (auth.role() = 'service_role');
END;
$function$;