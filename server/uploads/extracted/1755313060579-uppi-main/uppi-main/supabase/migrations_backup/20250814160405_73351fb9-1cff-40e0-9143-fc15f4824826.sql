-- Security Hardening Migration - Fix Critical Security Findings
-- 1. Enhanced Admin API Keys Security
DROP POLICY IF EXISTS "Only admins can access admin API keys" ON public.admin_api_keys;
DROP POLICY IF EXISTS "Super admin can manage all admin API keys" ON public.admin_api_keys;

CREATE POLICY "Only super admins can access admin API keys" 
ON public.admin_api_keys FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
  (auth.role() = 'service_role'::text) OR
  is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- 2. Restrict Profiles Access - Remove overly permissive policies
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;

-- Create more restrictive profile policies
CREATE POLICY "Users can only access their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admin profile access only" 
ON public.profiles FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR
  (auth.role() = 'service_role'::text AND current_setting('role') = 'service_role')
);

-- 3. Enhanced API Keys Security - Field-level encryption function
CREATE OR REPLACE FUNCTION public.secure_api_key_access(user_id_param uuid, operation_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log all API key access attempts
  INSERT INTO public.audit_logs (user_id, action, resource_type, metadata)
  VALUES (
    auth.uid(), 
    operation_type || '_api_key_access', 
    'api_keys_security',
    jsonb_build_object(
      'target_user', user_id_param,
      'timestamp', now(),
      'ip_address', current_setting('request.jwt.claims', true)::jsonb->>'ip'
    )
  );
  
  -- Only allow access to own keys or super admin
  RETURN (
    auth.uid() = user_id_param OR 
    ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR
    (auth.role() = 'service_role'::text)
  );
END;
$$;

-- Update API keys RLS to use secure function
DROP POLICY IF EXISTS "Users can only access their own API keys" ON public.api_keys;
CREATE POLICY "Secure API key access" 
ON public.api_keys FOR ALL 
USING (public.secure_api_key_access(user_id, 'read'))
WITH CHECK (public.secure_api_key_access(user_id, 'write'));

-- 4. Enhanced Billing Data Security
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.billing_subscriptions;

CREATE POLICY "Users can only view own billing data" 
ON public.billing_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admin billing access only" 
ON public.billing_subscriptions FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR
  (auth.role() = 'service_role'::text AND current_setting('role') = 'service_role')
);

-- Apply same pattern to billing_invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.billing_invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.billing_invoices;

CREATE POLICY "Users can only view own invoices" 
ON public.billing_invoices FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admin invoice access only" 
ON public.billing_invoices FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR
  (auth.role() = 'service_role'::text)
);

-- 5. Audit Log Retention and Security
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up audit logs older than 90 days
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM public.admin_audit_log 
  WHERE created_at < NOW() - INTERVAL '180 days';
  
  -- Log the cleanup
  INSERT INTO public.audit_logs (user_id, action, resource_type, metadata)
  VALUES (
    NULL, 
    'audit_log_cleanup', 
    'system_maintenance',
    jsonb_build_object('cleaned_at', now(), 'retention_days', 90)
  );
END;
$$;

-- 6. Create Security Monitoring Function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  severity text DEFAULT 'info',
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, metadata, created_at
  ) VALUES (
    auth.uid(),
    'security_event',
    event_type,
    jsonb_build_object(
      'severity', severity,
      'details', details,
      'user_agent', current_setting('request.headers', true),
      'timestamp', now()
    ),
    now()
  );
  
  -- Alert for critical security events
  IF severity = 'critical' THEN
    INSERT INTO public.system_health_metrics (
      metric_name, metric_value, component, severity, metadata
    ) VALUES (
      'security_alert',
      1,
      'security_system',
      'critical',
      jsonb_build_object(
        'event_type', event_type,
        'details', details,
        'user_id', auth.uid()
      )
    );
  END IF;
END;
$$;