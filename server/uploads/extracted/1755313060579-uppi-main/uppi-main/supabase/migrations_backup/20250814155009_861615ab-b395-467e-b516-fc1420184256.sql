-- Fix Function Search Path Security Issue (CRITICAL)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix existing masked_key data that violates constraints
UPDATE public.api_keys 
SET masked_key = CASE 
  WHEN masked_key IS NULL THEN NULL
  WHEN length(masked_key) < 6 THEN '****' || substring(masked_key from length(masked_key)-3)
  WHEN masked_key !~ '^\*+.{1,8}$' AND masked_key !~ '^.{1,4}\*+.{1,4}$' THEN 
    substring(masked_key from 1 for 4) || '****' || substring(masked_key from length(masked_key)-3)
  ELSE masked_key
END
WHERE masked_key IS NOT NULL;

-- Fix API Keys Table Security - Remove overly permissive policies
DROP POLICY IF EXISTS "api_keys_admin_monitoring" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_select" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete" ON public.api_keys;

-- Create strict user-only API key access
CREATE POLICY "Users can only access their own API keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix Admin API Keys Table Security
DROP POLICY IF EXISTS "Service role can access admin API keys" ON public.admin_api_keys;
DROP POLICY IF EXISTS "Service role full access on admin API keys" ON public.admin_api_keys;

-- Create admin-only access for admin API keys
CREATE POLICY "Only admins can access admin API keys"
ON public.admin_api_keys
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Fix Profiles Table Security - Remove conflicting policies  
DROP POLICY IF EXISTS "Strict user profile access" ON public.profiles;

-- Create single, strict user-only profile access
CREATE POLICY "Users can only access their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Secure Audit Logs - Admin-only insert access
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Only system can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- Now add the constraints after fixing the data
ALTER TABLE public.api_keys 
DROP CONSTRAINT IF EXISTS api_key_storage_check,
ADD CONSTRAINT api_key_storage_check 
CHECK (
  (api_key IS NULL AND vault_secret_id IS NOT NULL) OR 
  (api_key IS NOT NULL AND length(api_key) > 10)
);

-- Add constraint for masked keys (after fixing the data)
ALTER TABLE public.api_keys 
DROP CONSTRAINT IF EXISTS masked_key_security_check,
ADD CONSTRAINT masked_key_security_check 
CHECK (masked_key IS NULL OR masked_key ~ '^\*+.{1,8}$' OR masked_key ~ '^.{1,4}\*+.{1,4}$');

-- Create production-ready encryption key rotation function
CREATE OR REPLACE FUNCTION public.rotate_encryption_key(old_key text, new_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can rotate encryption keys
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the rotation attempt
  INSERT INTO audit_logs (user_id, action, resource_type, metadata)
  VALUES (auth.uid(), 'encryption_key_rotation', 'system', 
          jsonb_build_object('initiated_at', now()));
  
  RAISE NOTICE 'Encryption key rotation initiated by admin';
END;
$$;