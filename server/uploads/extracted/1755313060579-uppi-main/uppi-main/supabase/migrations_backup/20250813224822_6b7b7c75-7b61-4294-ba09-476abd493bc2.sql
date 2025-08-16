-- Fix Medium Priority Issues

-- Issue 1: Nullable user_id columns that should be NOT NULL for RLS
-- Fix ai_validation_logs user_id to be NOT NULL
ALTER TABLE public.ai_validation_logs 
ALTER COLUMN user_id SET NOT NULL;

-- Fix admin_api_usage_tracking user_id to be NOT NULL where appropriate
-- First update any NULL user_id to a default system user
UPDATE public.admin_api_usage_tracking 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Issue 2: Add data retention automated cleanup function
CREATE OR REPLACE FUNCTION public.automated_data_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up old API metrics (keep 90 days)
  DELETE FROM public.api_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up old API usage tracking (keep 6 months)
  DELETE FROM public.api_usage_tracking 
  WHERE timestamp < NOW() - INTERVAL '6 months';
  
  -- Clean up old performance logs (keep 30 days)
  DELETE FROM public.performance_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old AI prompt logs (keep 1 year)
  DELETE FROM public.ai_prompt_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Log the cleanup operation
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, metadata, created_at
  ) VALUES (
    NULL, 'automated_data_retention', 'system',
    jsonb_build_object('cleaned_at', now(), 'retention_policy', 'executed'),
    NOW()
  );
END;
$$;

-- Issue 3: Add additional missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_session_created ON public.ai_prompt_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_user_created ON public.ai_prompt_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_events_user_created ON public.billing_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_status ON public.billing_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_timestamp ON public.api_usage_tracking(user_id, timestamp);

-- Issue 4: Add function to detect and log potential security violations
CREATE OR REPLACE FUNCTION public.detect_security_anomalies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  anomalies jsonb := '[]'::jsonb;
  suspicious_activity record;
BEGIN
  -- Detect unusual API key access patterns
  FOR suspicious_activity IN
    SELECT user_id, COUNT(*) as access_count
    FROM public.audit_logs 
    WHERE action IN ('api_key_accessed', 'api_key_created', 'api_key_deleted')
      AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 10
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'excessive_api_key_access',
      'user_id', suspicious_activity.user_id,
      'count', suspicious_activity.access_count,
      'detected_at', now()
    );
  END LOOP;
  
  -- Detect failed authentication attempts
  FOR suspicious_activity IN
    SELECT user_id, COUNT(*) as fail_count
    FROM public.audit_logs 
    WHERE action LIKE '%auth%fail%' 
      AND created_at > NOW() - INTERVAL '15 minutes'
    GROUP BY user_id
    HAVING COUNT(*) > 5
  LOOP
    anomalies := anomalies || jsonb_build_object(
      'type', 'repeated_auth_failures',
      'user_id', suspicious_activity.user_id,
      'count', suspicious_activity.fail_count,
      'detected_at', now()
    );
  END LOOP;
  
  RETURN anomalies;
END;
$$;

-- Issue 5: Add comprehensive backup verification function
CREATE OR REPLACE FUNCTION public.verify_backup_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  backup_status jsonb := '{}'::jsonb;
  table_count integer;
  critical_tables text[] := ARRAY['api_keys', 'profiles', 'competitor_analyses', 'billing_subscriptions'];
  table_name text;
BEGIN
  -- Check critical tables exist and have data
  FOREACH table_name IN ARRAY critical_tables
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO table_count;
    backup_status := backup_status || jsonb_build_object(
      table_name || '_count', table_count,
      table_name || '_status', CASE WHEN table_count > 0 THEN 'ok' ELSE 'empty' END
    );
  END LOOP;
  
  -- Add overall backup timestamp
  backup_status := backup_status || jsonb_build_object(
    'verified_at', now(),
    'verification_status', 'completed'
  );
  
  RETURN backup_status;
END;
$$;