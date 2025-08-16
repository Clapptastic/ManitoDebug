-- Fix Function Search Path Mutable security warnings by updating functions with CASCADE
-- This prevents search_path injection attacks

-- Update existing functions to have secure search_path using CASCADE
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$function$;

DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$function$;

DROP FUNCTION IF EXISTS public.is_user_admin(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
$function$;

DROP FUNCTION IF EXISTS public.has_platform_role(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.has_platform_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = $1 AND role = role_name
  );
$function$;

-- Recreate the dropped policies that were dependent on these functions
-- Profiles table policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (is_user_admin(auth.uid()))
WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (is_user_admin(auth.uid()));

-- Documentation table policies
CREATE POLICY "Admins can manage all documentation" ON public.documentation
FOR ALL USING (is_user_admin(auth.uid()));

-- System components table policies
CREATE POLICY "Admins can manage system components" ON public.system_components
FOR ALL USING (is_user_admin(auth.uid()) OR has_platform_role(auth.uid(), 'super_admin'));

-- Platform roles table policies
CREATE POLICY "Admins can manage all roles" ON public.platform_roles
FOR ALL USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can view all roles" ON public.platform_roles
FOR SELECT USING (is_user_admin(auth.uid()) OR auth.uid() = user_id);

-- Organizations table policies
CREATE POLICY "Admins can manage organizations" ON public.organizations
FOR ALL USING (is_user_admin(auth.uid()));