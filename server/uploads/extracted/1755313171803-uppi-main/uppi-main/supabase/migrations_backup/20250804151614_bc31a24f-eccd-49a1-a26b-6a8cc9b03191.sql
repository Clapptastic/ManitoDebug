-- Fix RLS policies for admin tables with correct names
DROP POLICY IF EXISTS "Admins can manage system components" ON public.system_components;

CREATE POLICY "Super admins can manage system components" 
ON public.system_components 
FOR ALL 
USING (is_user_admin(auth.uid()));

-- Drop existing affiliate policies and create new ones
DROP POLICY IF EXISTS "Service role can manage affiliate_links" ON public.affiliate_links;

CREATE POLICY "Admins can view affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can insert affiliate links" 
ON public.affiliate_links 
FOR INSERT 
WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY "Admins can update affiliate links" 
ON public.affiliate_links 
FOR UPDATE 
USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can delete affiliate links" 
ON public.affiliate_links 
FOR DELETE 
USING (is_user_admin(auth.uid()));