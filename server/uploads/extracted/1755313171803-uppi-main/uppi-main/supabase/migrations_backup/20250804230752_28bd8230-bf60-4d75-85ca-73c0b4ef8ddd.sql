-- Fix RLS policies step by step to avoid dependency issues

-- First, drop policies that use the function
DROP POLICY IF EXISTS "Super admins full access to microservices" ON public.microservices;
DROP POLICY IF EXISTS "Super admins can manage API usage costs" ON public.api_usage_costs;  
DROP POLICY IF EXISTS "Users and super admins can view documents" ON public.documents;
DROP POLICY IF EXISTS "Users and super admins can update documents" ON public.documents;
DROP POLICY IF EXISTS "Users and super admins can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Super admins can manage frontend permissions" ON public.frontend_permissions;
DROP POLICY IF EXISTS "Super admins can manage master company profiles" ON public.master_company_profiles;

-- Now drop and recreate the function
DROP FUNCTION IF EXISTS public.is_current_user_super_admin();

-- Create better super admin function
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT COALESCE(
    (
      SELECT CASE 
        WHEN auth.uid() IS NULL THEN false
        ELSE EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role::text = 'super_admin'
        ) OR EXISTS (
          SELECT 1 FROM public.platform_roles 
          WHERE user_id = auth.uid() 
          AND role::text = 'super_admin'
        )
      END
    ),
    false
  );
$function$;

-- Recreate microservices policy with direct role checks (more reliable)
CREATE POLICY "Super admins can manage microservices"
ON public.microservices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR
  (current_setting('role'::text) = 'service_role'::text)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR
  (current_setting('role'::text) = 'service_role'::text)
);

-- Recreate other policies
CREATE POLICY "Super admins can manage API usage costs"
ON public.api_usage_costs
FOR ALL
USING (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR
  (current_setting('role'::text) = 'service_role'::text)
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR
  (current_setting('role'::text) = 'service_role'::text)
);

-- Recreate documents policies
CREATE POLICY "Users and super admins can view documents"
ON public.documents
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Users and super admins can update documents"
ON public.documents
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Users and super admins can delete documents"
ON public.documents
FOR DELETE
USING (
  (auth.uid() = user_id) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  ) OR 
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text IN ('super_admin', 'admin')
  )
);

-- Recreate other policies using the function
CREATE POLICY "Super admins can manage frontend permissions"
ON public.frontend_permissions
FOR ALL
USING (is_current_user_super_admin())
WITH CHECK (is_current_user_super_admin());

CREATE POLICY "Super admins can manage master company profiles"
ON public.master_company_profiles
FOR ALL
USING (is_current_user_super_admin())
WITH CHECK (is_current_user_super_admin());