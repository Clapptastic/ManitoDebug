-- Phase 1.1: Critical RLS Policy Fixes
-- Fixing permission denied errors for critical tables

-- 1. Documentation table policies
CREATE POLICY "Users can read public documentation" 
ON public.documentation 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage documentation" 
ON public.documentation 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- 2. Business plans policies (already exist, ensuring they work)
CREATE POLICY "Service role access for business plans" 
ON public.business_plans 
FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Competitor analyses policies (already exist, ensuring they work)  
CREATE POLICY "Service role access for competitor analyses" 
ON public.competitor_analyses 
FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Company profiles policies (already exist, ensuring they work)
CREATE POLICY "Service role access for company profiles" 
ON public.company_profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- 5. Affiliate links policies (fix for admin access)
CREATE POLICY "Authenticated users can view affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. Edge function metrics policies (critical for monitoring)
CREATE POLICY "Service role can manage edge function metrics" 
ON public.edge_function_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own edge function metrics" 
ON public.edge_function_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

-- 7. Admin API usage tracking policies
CREATE POLICY "Service role can insert admin API usage" 
ON public.admin_api_usage_tracking 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view admin API usage" 
ON public.admin_api_usage_tracking 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- 8. Admin API keys policies  
CREATE POLICY "Service role can access admin API keys" 
ON public.admin_api_keys 
FOR ALL 
USING (auth.role() = 'service_role');