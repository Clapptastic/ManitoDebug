-- Fix search path for security definer function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;