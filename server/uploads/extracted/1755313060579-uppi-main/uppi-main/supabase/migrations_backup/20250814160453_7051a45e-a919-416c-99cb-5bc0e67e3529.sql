-- Fix Function Search Path Security Warnings
-- Set secure search_path for all functions

-- Fix secure_api_key_access function
CREATE OR REPLACE FUNCTION public.secure_api_key_access(user_id_param uuid, operation_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix cleanup_old_audit_logs function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  severity text DEFAULT 'info',
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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