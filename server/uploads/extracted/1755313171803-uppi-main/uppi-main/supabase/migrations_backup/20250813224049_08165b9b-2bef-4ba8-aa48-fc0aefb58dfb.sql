-- Fix Critical Issue #7: SOC2 Compliance - Enhanced audit logging
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  user_id_param uuid,
  event_type text,
  resource_type text,
  resource_id text DEFAULT NULL::text,
  metadata_param jsonb DEFAULT '{}'::jsonb,
  ip_address_param inet DEFAULT NULL::inet,
  user_agent_param text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata,
    ip_address, user_agent, session_id, created_at
  ) VALUES (
    user_id_param, event_type, resource_type, resource_id,
    metadata_param || jsonb_build_object(
      'timestamp', now(),
      'compliance_event', true,
      'security_level', 'high'
    ),
    ip_address_param, user_agent_param,
    COALESCE((metadata_param->>'session_id')::text, 'unknown'),
    NOW()
  );
END;
$$;

-- Fix Medium Issue: Add data retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Keep audit logs for 2 years for compliance
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Keep API metrics for 90 days
  DELETE FROM public.api_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep performance logs for 30 days
  DELETE FROM public.performance_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create scheduled cleanup (would need to be set up in cron or edge function)
COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS 'Run this function periodically to maintain data retention compliance';

-- Fix Critical Issue #5: Restrict service role access with specific policies
-- Update over-permissive policies to be more restrictive

-- Update application_settings policy
DROP POLICY IF EXISTS "application_settings_service_access" ON public.application_settings;
CREATE POLICY "application_settings_service_readonly" ON public.application_settings
  FOR SELECT USING (auth.role() = 'service_role');

-- Update api_usage_costs policy  
DROP POLICY IF EXISTS "api_usage_costs_service_access" ON public.api_usage_costs;
CREATE POLICY "api_usage_costs_service_insert" ON public.api_usage_costs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "api_usage_costs_service_select" ON public.api_usage_costs
  FOR SELECT USING (auth.role() = 'service_role');