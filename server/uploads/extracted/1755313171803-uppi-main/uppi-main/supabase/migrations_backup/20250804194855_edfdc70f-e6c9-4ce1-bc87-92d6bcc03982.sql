-- Fix type_coverage_metrics RLS policies for super admins
DROP POLICY IF EXISTS "Admins can manage all type coverage metrics" ON public.type_coverage_metrics;
DROP POLICY IF EXISTS "Authenticated users can view type coverage metrics" ON public.type_coverage_metrics;

CREATE POLICY "Super admins can manage type coverage metrics" 
ON public.type_coverage_metrics 
FOR ALL 
USING (is_super_admin_user())
WITH CHECK (is_super_admin_user());

-- Ensure the table has proper structure
ALTER TABLE public.type_coverage_metrics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;