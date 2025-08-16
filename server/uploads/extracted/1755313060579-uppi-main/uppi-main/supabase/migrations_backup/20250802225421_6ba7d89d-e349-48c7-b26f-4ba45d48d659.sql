-- Fix missing RLS policies for tables without them

-- Affiliate Links table - should be admin only
CREATE POLICY "Admins can manage affiliate links" 
ON public.affiliate_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- API Cost Summary - users can view their own data, admins can view all
CREATE POLICY "Users can view their own API cost summary" 
ON public.api_cost_summary 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all API cost summaries" 
ON public.api_cost_summary 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Monthly API Costs - admin only view
CREATE POLICY "Admins can view monthly API costs" 
ON public.monthly_api_costs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Website Analytics - admin only
CREATE POLICY "Admins can manage website analytics" 
ON public.website_analytics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Fix service role access for edge functions by adding service role policies where needed
CREATE POLICY "Service role can manage api_cost_summary" 
ON public.api_cost_summary 
FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text OR 
  current_setting('role'::text) = 'service_role'::text
);

CREATE POLICY "Service role can manage monthly_api_costs" 
ON public.monthly_api_costs 
FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text OR 
  current_setting('role'::text) = 'service_role'::text
);

CREATE POLICY "Service role can manage website_analytics" 
ON public.website_analytics 
FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text OR 
  current_setting('role'::text) = 'service_role'::text
);

CREATE POLICY "Service role can manage affiliate_links" 
ON public.affiliate_links 
FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text OR 
  current_setting('role'::text) = 'service_role'::text
);