-- Fix RLS policies and super admin function issues
-- Drop existing problematic function and recreate it with better error handling
DROP FUNCTION IF EXISTS public.is_current_user_super_admin();

-- Create improved super admin function with better auth context handling
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

-- Update microservices RLS policy to be more permissive for authenticated super admins
DROP POLICY IF EXISTS "Super admins full access to microservices" ON public.microservices;

CREATE POLICY "Super admins can manage microservices"
ON public.microservices
FOR ALL
USING (
  -- Check if user is super admin via profiles table
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR 
  -- Check if user is super admin via platform_roles table  
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR
  -- Allow service role
  (current_setting('role'::text) = 'service_role'::text)
)
WITH CHECK (
  -- Same checks for inserts/updates
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

-- Fix api_usage_costs RLS policy 
DROP POLICY IF EXISTS "Super admins can manage API usage costs" ON public.api_usage_costs;

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

-- Fix documents RLS policy
DROP POLICY IF EXISTS "Users and super admins can view documents" ON public.documents;
DROP POLICY IF EXISTS "Users and super admins can update documents" ON public.documents; 
DROP POLICY IF EXISTS "Users and super admins can delete documents" ON public.documents;

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