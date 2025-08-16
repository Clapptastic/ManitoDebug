-- Fix RLS policies for competitive analysis functionality

-- 1. Fix analysis_provider_runs table policies
DROP POLICY IF EXISTS "analysis_provider_runs_user_access" ON analysis_provider_runs;

CREATE POLICY "analysis_provider_runs_user_access" 
ON analysis_provider_runs 
FOR ALL 
USING (
  (user_id = auth.uid()) OR 
  (auth.role() = 'service_role'::text) OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  (auth.role() = 'service_role'::text) OR 
  is_admin_user(auth.uid())
);

-- 2. Fix analysis_runs table policies - add service role access
CREATE POLICY "Service role can manage analysis runs" 
ON analysis_runs 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 3. Fix api_usage_costs table policies - ensure service role can insert
CREATE POLICY "Service role can insert api usage costs" 
ON api_usage_costs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. Fix analysis_combined table policies - add service role access
CREATE POLICY "Service role can manage analysis_combined" 
ON analysis_combined 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 5. Ensure competitor_analyses policies allow service role access
CREATE POLICY "Service role can manage competitor_analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 6. Fix the UUID issue by ensuring proper admin functions
-- Update any functions that might be using invalid UUID formats
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_role_result TEXT;
BEGIN
    -- Handle NULL user_id
    IF user_id_param IS NULL THEN
        RETURN 'user';
    END IF;
    
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    -- Check if super admin first
    IF public.is_super_admin(user_email) THEN
        RETURN 'super_admin';
    END IF;
    
    -- Get role from user_roles table
    SELECT role INTO user_role_result 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(user_role_result, 'user');
END;
$function$;

-- 7. Create a function to handle system operations with proper UUID handling
CREATE OR REPLACE FUNCTION public.handle_system_operation(operation_type text, user_id_param uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Allow service role to perform system operations
    IF auth.role() = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Allow authenticated users for their own operations
    IF user_id_param IS NOT NULL AND auth.uid() = user_id_param THEN
        RETURN true;
    END IF;
    
    -- Allow admins
    IF is_admin_user(auth.uid()) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;