-- Drop and recreate the function with correct parameters
DROP FUNCTION IF EXISTS public.secure_api_key_access(uuid, text);

CREATE OR REPLACE FUNCTION public.secure_api_key_access(
  target_user_id UUID,
  operation_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if user is accessing their own data
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow service role
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- Allow admins
  IF is_admin_user(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Fix api_usage_costs RLS policies to allow inserts
CREATE POLICY "Service role can insert api usage costs" 
ON public.api_usage_costs 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert their own api usage costs" 
ON public.api_usage_costs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);