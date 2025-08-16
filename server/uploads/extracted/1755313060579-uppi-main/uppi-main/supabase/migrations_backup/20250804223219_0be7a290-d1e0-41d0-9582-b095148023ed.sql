-- Fix RLS policies for super admin access to admin tables

-- Microservices table policies
CREATE POLICY "Super admins can manage microservices" 
ON public.microservices 
FOR ALL 
USING (is_super_admin());

-- Type coverage metrics policies  
CREATE POLICY "Super admins can manage type coverage metrics"
ON public.type_coverage_metrics
FOR ALL
USING (is_super_admin());

-- Master company profiles policies
CREATE POLICY "Super admins can manage master company profiles"
ON public.master_company_profiles
FOR ALL  
USING (is_super_admin());

-- Documents table policies
CREATE POLICY "Super admins can manage documents"
ON public.documents
FOR ALL
USING (is_super_admin());

-- Frontend permissions policies
CREATE POLICY "Super admins can manage frontend permissions"
ON public.frontend_permissions
FOR ALL
USING (is_super_admin());

-- API usage costs policies
CREATE POLICY "Super admins can manage api usage costs"
ON public.api_usage_costs
FOR ALL
USING (is_super_admin());