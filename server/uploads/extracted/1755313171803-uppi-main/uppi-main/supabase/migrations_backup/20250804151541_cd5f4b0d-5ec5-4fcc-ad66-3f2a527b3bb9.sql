-- Fix RLS policies for admin tables
DROP POLICY IF EXISTS "Admin users can view system components" ON public.system_components;
DROP POLICY IF EXISTS "Admin users can manage system components" ON public.system_components;

-- Create correct policies using the existing functions
CREATE POLICY "Admins can view system components" 
ON public.system_components 
FOR SELECT 
USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can manage system components" 
ON public.system_components 
FOR ALL 
USING (is_user_admin(auth.uid()));

-- Fix affiliate_links policies 
DROP POLICY IF EXISTS "Admins can manage affiliate links" ON public.affiliate_links;

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