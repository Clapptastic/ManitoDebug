-- Fix critical security issues - corrected trigger syntax

-- 1. Remove the overly permissive public profiles policy
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

-- 2. Create more restrictive profile viewing policy
CREATE POLICY "Users can view own profile and admin can view all"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- 3. Strengthen API keys security - remove overly broad service role access
DROP POLICY IF EXISTS "Service role full access to API keys" ON api_keys;

-- 4. Create more specific API keys policies
CREATE POLICY "API keys service operations only"
ON api_keys FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5. Add enhanced audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to sensitive tables
  IF TG_TABLE_NAME IN ('api_keys', 'billing_invoices', 'competitor_analyses', 'profiles') THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      auth.uid(),
      TG_OP || '_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'timestamp', now(),
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;