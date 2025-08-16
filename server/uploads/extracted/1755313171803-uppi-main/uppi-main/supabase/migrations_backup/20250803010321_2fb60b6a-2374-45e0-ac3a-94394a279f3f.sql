-- Update model_versions RLS policies to allow admin users access

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can view all model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Super admins can insert model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Super admins can update model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Super admins can delete model versions" ON public.model_versions;

-- Create new policies allowing admin and super_admin access
CREATE POLICY "Admins can view all model versions" 
ON public.model_versions 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert model versions" 
ON public.model_versions 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update model versions" 
ON public.model_versions 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete model versions" 
ON public.model_versions 
FOR DELETE 
USING (is_admin_user());