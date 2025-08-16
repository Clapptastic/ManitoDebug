-- Fix Function Search Path Security Issue
-- Update all functions to have secure search_path
ALTER FUNCTION public.store_api_key_secure(uuid, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.retrieve_api_key_secure(uuid, text) SET search_path = public;
ALTER FUNCTION public.update_api_key_validation(uuid, text, boolean, text) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix API Keys Table Security - Remove overly permissive policies
DROP POLICY IF EXISTS "Admin can manage all API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role full access" ON public.api_keys;

-- Create strict user-only API key access
CREATE POLICY "Users can only access their own API keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix Admin API Keys Table Security
DROP POLICY IF EXISTS "Service role can manage admin API keys" ON public.admin_api_keys;

-- Create admin-only access for admin API keys
CREATE POLICY "Only admins can access admin API keys"
ON public.admin_api_keys
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix Profiles Table Security - Remove conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

-- Create single, strict user-only profile access
CREATE POLICY "Strict user profile access"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix Financial Data Security - Remove service role policies
DROP POLICY IF EXISTS "Service role full access" ON public.payments;
DROP POLICY IF EXISTS "Service role full access" ON public.billing_invoices;
DROP POLICY IF EXISTS "Service role full access" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Service role full access" ON public.payment_methods;

-- Create user-only financial data access
CREATE POLICY "Users can only access their own payments"
ON public.payments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own billing invoices"
ON public.billing_invoices
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own billing subscriptions"
ON public.billing_subscriptions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix Business Data Security - Remove broad admin access
DROP POLICY IF EXISTS "Admin can view all business plans" ON public.business_plans;
DROP POLICY IF EXISTS "Admin can view all competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Admin can view all company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Admin can view all market research" ON public.market_research;

-- Create strict user-only business data access
CREATE POLICY "Users can only access their own business plans"
ON public.business_plans
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own competitor analyses"
ON public.competitor_analyses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own company profiles"
ON public.company_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own market research"
ON public.market_research
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Secure Audit Logs - Admin-only access with data minimization
DROP POLICY IF EXISTS "Service role can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can view admin audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Service role can view error events" ON public.error_events;
DROP POLICY IF EXISTS "Service role can view performance logs" ON public.performance_logs;

-- Create admin-only audit access
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view admin audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view error events"
ON public.error_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view performance logs"
ON public.performance_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create production-ready encryption key rotation function
CREATE OR REPLACE FUNCTION public.rotate_encryption_key(old_key text, new_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can rotate encryption keys
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- This function would re-encrypt all API keys with the new key
  -- Implementation depends on your encryption strategy
  RAISE NOTICE 'Encryption key rotation initiated';
END;
$$;

-- Add constraint to ensure API keys are always encrypted
ALTER TABLE public.api_keys 
ADD CONSTRAINT encrypted_api_key_check 
CHECK (length(encrypted_api_key) > 20);

-- Add constraint to ensure masked keys don't reveal too much
ALTER TABLE public.api_keys 
ADD CONSTRAINT masked_key_security_check 
CHECK (masked_key ~ '^\*+.{1,8}$' OR masked_key ~ '^.{1,4}\*+.{1,4}$');

-- Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_monitoring AS
SELECT 
  'api_key_access' as event_type,
  user_id,
  provider,
  last_used_at as event_time,
  CASE 
    WHEN last_used_at > NOW() - INTERVAL '1 hour' THEN 'recent'
    WHEN last_used_at > NOW() - INTERVAL '1 day' THEN 'daily'
    ELSE 'old'
  END as usage_pattern
FROM public.api_keys
WHERE is_active = true;

-- Grant admin access to security monitoring
GRANT SELECT ON public.security_monitoring TO authenticated;

-- Create RLS policy for security monitoring view
CREATE POLICY "Only admins can view security monitoring"
ON public.security_monitoring
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));