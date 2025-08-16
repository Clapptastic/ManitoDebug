-- Fix database access issues and add missing RPC functions for edge functions
-- This addresses the "permission denied for schema public" errors

-- Create secure RPC function for getting user API keys
CREATE OR REPLACE FUNCTION public.get_user_api_keys_safe(user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, provider text, masked_key text, status text, is_active boolean, last_validated timestamp with time zone, updated_at timestamp with time zone, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the target user ID (either from parameter or current auth user)
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Verify user is authenticated
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    ak.id,
    ak.provider,
    ak.masked_key,
    ak.status,
    ak.is_active,
    ak.last_validated,
    ak.updated_at,
    ak.error_message
  FROM public.api_keys ak
  WHERE ak.user_id = target_user_id 
    AND ak.is_active = true;
END;
$function$;

-- Create secure RPC function for getting API key for validation
CREATE OR REPLACE FUNCTION public.get_user_api_key_for_validation(provider_param text)
RETURNS TABLE(api_key text, id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    ak.api_key,
    ak.id,
    ak.status
  FROM public.api_keys ak
  WHERE ak.user_id = current_user_id 
    AND ak.provider = provider_param
    AND ak.is_active = true
  LIMIT 1;
END;
$function$;

-- Create secure RPC function for updating API key status
CREATE OR REPLACE FUNCTION public.update_api_key_status(
  provider_param text,
  status_param text,
  error_message_param text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  UPDATE public.api_keys 
  SET 
    status = status_param,
    error_message = error_message_param,
    last_validated = now(),
    updated_at = now()
  WHERE user_id = current_user_id 
    AND provider = provider_param;
  
  RETURN FOUND;
END;
$function$;

-- Create comprehensive error handling function
CREATE OR REPLACE FUNCTION public.log_application_error(
  error_type text,
  error_message text,
  error_context jsonb DEFAULT '{}'::jsonb,
  user_id_param uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_error_id uuid;
  effective_user_id uuid;
BEGIN
  effective_user_id := COALESCE(user_id_param, auth.uid());
  
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    effective_user_id,
    'application_error',
    'system',
    error_type,
    jsonb_build_object(
      'error_type', error_type,
      'error_message', error_message,
      'context', error_context,
      'timestamp', now()
    ),
    now()
  ) RETURNING id INTO new_error_id;
  
  RETURN new_error_id;
END;
$function$;

-- Create function to fix UUID casting issues in system operations
CREATE OR REPLACE FUNCTION public.safe_uuid_cast(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  -- Handle special system identifiers
  IF input_text = 'system-0' OR input_text = 'system' THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  -- Try to cast as UUID, return null UUID if invalid
  BEGIN
    RETURN input_text::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  END;
END;
$function$;

-- Create system health monitoring function
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  health_data jsonb;
  db_connections int;
  active_users int;
  recent_errors int;
BEGIN
  -- Only allow admins or service role
  IF NOT (
    get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get basic metrics
  SELECT count(*) INTO db_connections FROM pg_stat_activity WHERE state = 'active';
  SELECT count(DISTINCT user_id) INTO active_users FROM audit_logs WHERE created_at > now() - interval '1 hour';
  SELECT count(*) INTO recent_errors FROM audit_logs WHERE action = 'application_error' AND created_at > now() - interval '1 hour';
  
  health_data := jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'metrics', jsonb_build_object(
      'active_connections', db_connections,
      'active_users_last_hour', active_users,
      'errors_last_hour', recent_errors
    ),
    'database_status', 'operational',
    'api_status', 'operational'
  );
  
  -- Mark as degraded if there are issues
  IF recent_errors > 10 OR db_connections > 90 THEN
    health_data := jsonb_set(health_data, '{status}', '"degraded"');
  END IF;
  
  RETURN health_data;
END;
$function$;

-- Add error recovery and cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up old analysis runs that are stuck
  UPDATE public.analysis_runs 
  SET 
    status = 'failed',
    error_message = 'Timeout - cleaned up by system',
    completed_at = now()
  WHERE status IN ('pending', 'running') 
    AND created_at < now() - interval '1 hour';
    
  -- Clean up old competitor analysis progress that's stuck
  UPDATE public.competitor_analysis_progress 
  SET 
    status = 'failed',
    error_message = 'Timeout - cleaned up by system',
    updated_at = now()
  WHERE status IN ('pending', 'running') 
    AND created_at < now() - interval '2 hours';
    
  -- Log the cleanup
  PERFORM public.log_application_error(
    'system_cleanup',
    'Automated cleanup of stuck sessions completed',
    jsonb_build_object('cleanup_time', now())
  );
END;
$function$;