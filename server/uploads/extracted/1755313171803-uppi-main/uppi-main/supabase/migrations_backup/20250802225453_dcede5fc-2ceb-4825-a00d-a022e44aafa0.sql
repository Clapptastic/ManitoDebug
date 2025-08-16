-- Fix missing RLS policies for actual tables

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

-- Add service role access for edge functions
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