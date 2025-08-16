-- Fix critical security and infrastructure issues
-- Only update functions, don't try to create existing tables

-- Create comprehensive API monitoring function if not exists
DO $$
BEGIN
  -- Check if function exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'track_api_performance_comprehensive') THEN
    EXECUTE $func$
      CREATE FUNCTION public.track_api_performance_comprehensive(
        endpoint_name text,
        execution_time_ms numeric,
        success boolean DEFAULT true,
        error_details text DEFAULT NULL,
        metadata jsonb DEFAULT '{}'::jsonb
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $function$
      BEGIN
        INSERT INTO public.performance_logs (
          operation_name,
          execution_time_ms,
          user_id,
          component,
          status,
          metadata
        ) VALUES (
          endpoint_name,
          execution_time_ms::integer,
          auth.uid(),
          'api_endpoint',
          CASE WHEN success THEN 'success' ELSE 'error' END,
          jsonb_build_object(
            'timestamp', now(),
            'error_details', error_details,
            'metadata', metadata
          )
        );
        
        -- Alert on slow operations (>5 seconds)
        IF execution_time_ms > 5000 THEN
          INSERT INTO public.system_health_metrics (
            metric_name,
            metric_value,
            metric_unit,
            component,
            severity,
            metadata
          ) VALUES (
            'slow_api_endpoint',
            execution_time_ms,
            'ms',
            endpoint_name,
            'warning',
            jsonb_build_object(
              'endpoint', endpoint_name,
              'user_id', auth.uid(),
              'execution_time_ms', execution_time_ms
            )
          );
        END IF;
      END;
      $function$;
    $func$;
  END IF;
END $$;

-- Update competitor analysis progress functions to remove hardcoded super admin
CREATE OR REPLACE FUNCTION public.insert_competitor_analysis_progress(session_id_param text, user_id_param uuid, total_competitors_param integer, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
  current_user_role text;
BEGIN
  current_user_role := get_user_role(auth.uid());
  
  -- Allow access for: same user, admins, super_admins, or service role
  IF NOT (
    auth.uid() = user_id_param OR 
    current_user_role IN ('admin', 'super_admin') OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  INSERT INTO competitor_analysis_progress (
    session_id,
    user_id,
    status,
    total_competitors,
    completed_competitors,
    progress_percentage,
    metadata
  ) VALUES (
    session_id_param,
    user_id_param,
    'pending',
    total_competitors_param,
    0,
    0,
    metadata_param
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_competitor_analysis_progress(session_id_param text, status_param text DEFAULT NULL::text, progress_percentage_param numeric DEFAULT NULL::numeric, completed_competitors_param integer DEFAULT NULL::integer, current_competitor_param text DEFAULT NULL::text, error_message_param text DEFAULT NULL::text, metadata_param jsonb DEFAULT NULL::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
  progress_user_id uuid;
BEGIN
  current_user_role := get_user_role(auth.uid());
  
  -- Get the user_id for this session
  SELECT user_id INTO progress_user_id
  FROM competitor_analysis_progress 
  WHERE session_id = session_id_param
  LIMIT 1;
  
  -- Allow access for: same user, admins, super_admins, or service role
  IF NOT (
    auth.uid() = progress_user_id OR 
    current_user_role IN ('admin', 'super_admin') OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied or session not found';
  END IF;
  
  UPDATE competitor_analysis_progress
  SET 
    status = COALESCE(status_param, status),
    progress_percentage = COALESCE(progress_percentage_param, progress_percentage),
    completed_competitors = COALESCE(completed_competitors_param, completed_competitors),
    current_competitor = COALESCE(current_competitor_param, current_competitor),
    error_message = COALESCE(error_message_param, error_message),
    metadata = COALESCE(metadata_param, metadata),
    updated_at = now()
  WHERE session_id = session_id_param;
  
  RETURN FOUND;
END;
$$;