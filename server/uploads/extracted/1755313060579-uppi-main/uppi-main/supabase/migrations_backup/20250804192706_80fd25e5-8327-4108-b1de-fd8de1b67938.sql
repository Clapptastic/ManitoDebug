-- Fix RLS policies for type_coverage_metrics table to allow proper access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin users can manage type coverage metrics" ON public.type_coverage_metrics;
DROP POLICY IF EXISTS "Admin users can view type coverage metrics" ON public.type_coverage_metrics;
DROP POLICY IF EXISTS "Admins can manage type coverage metrics" ON public.type_coverage_metrics;
DROP POLICY IF EXISTS "Super admins can manage type coverage metrics" ON public.type_coverage_metrics;

-- Create new comprehensive policies for type coverage metrics
CREATE POLICY "Super admins can manage type coverage metrics" 
ON public.type_coverage_metrics 
FOR ALL 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can view type coverage metrics" 
ON public.type_coverage_metrics 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can insert type coverage metrics" 
ON public.type_coverage_metrics 
FOR INSERT 
TO public 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);