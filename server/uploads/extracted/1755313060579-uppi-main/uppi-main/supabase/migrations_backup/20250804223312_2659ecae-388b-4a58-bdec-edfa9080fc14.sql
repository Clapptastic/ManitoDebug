-- Update RLS policies to use consistent super admin function calls

-- Drop and recreate microservices policy with updated function
DROP POLICY IF EXISTS "Super admins can manage microservices" ON public.microservices;
CREATE POLICY "Super admins can manage microservices" 
ON public.microservices 
FOR ALL 
USING (is_super_admin_user());

-- Update type coverage metrics policy
DROP POLICY IF EXISTS "Super admins can manage type coverage metrics" ON public.type_coverage_metrics;
CREATE POLICY "Super admins can manage type coverage metrics"
ON public.type_coverage_metrics
FOR ALL
USING (is_super_admin_user());

-- Ensure all policies use the same consistent function
-- The policies for other tables already exist and use is_super_admin_user()

-- Check if the service role bypass is working for admin operations
CREATE POLICY "Service role bypass for microservices"
ON public.microservices
FOR ALL
USING (current_setting('role') = 'service_role' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass for type coverage"  
ON public.type_coverage_metrics
FOR ALL
USING (current_setting('role') = 'service_role' OR auth.jwt() ->> 'role' = 'service_role');