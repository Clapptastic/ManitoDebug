-- Fix RLS policies for model_versions table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow super admins to view all model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Allow super admins to insert model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Allow super admins to update model versions" ON public.model_versions;
DROP POLICY IF EXISTS "Allow super admins to delete model versions" ON public.model_versions;

-- Create new policies that properly check for super_admin role
CREATE POLICY "Super admins can view all model versions" 
ON public.model_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert model versions" 
ON public.model_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update model versions" 
ON public.model_versions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete model versions" 
ON public.model_versions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);