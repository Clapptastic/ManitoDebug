-- Create helper functions for logging that can be used until TypeScript types are updated

CREATE OR REPLACE FUNCTION public.insert_error_log(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'medium',
  p_environment TEXT DEFAULT 'development',
  p_user_agent TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id, error_type, error_message, error_stack, component, action,
    metadata, severity, environment, user_agent, url
  )
  VALUES (
    p_user_id, p_error_type, p_error_message, p_error_stack, p_component, p_action,
    p_metadata, p_severity, p_environment, p_user_agent, p_url
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_performance_metric(
  p_user_id UUID,
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.performance_metrics (
    user_id, metric_name, metric_value, metadata
  )
  VALUES (
    p_user_id, p_metric_name, p_metric_value, p_metadata
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;