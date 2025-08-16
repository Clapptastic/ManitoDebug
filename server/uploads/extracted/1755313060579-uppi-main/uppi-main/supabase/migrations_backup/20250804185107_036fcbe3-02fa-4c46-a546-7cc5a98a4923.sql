-- =================================================================
-- TARGETED FIX: EDGE FUNCTION PERMISSIONS FOR API_METRICS
-- Fix the critical permission denied errors
-- =================================================================

-- 1. Add service role policies for api_metrics table (CRITICAL)
DROP POLICY IF EXISTS "Service role can manage api metrics" ON public.api_metrics;
CREATE POLICY "Service role can manage api metrics"
ON public.api_metrics
FOR ALL
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  OR (current_setting('role'::text) = 'service_role'::text)
);

-- 2. Add service role policies for api_usage_costs table
DROP POLICY IF EXISTS "Service role can manage api usage costs" ON public.api_usage_costs;
CREATE POLICY "Service role can manage api usage costs"
ON public.api_usage_costs
FOR ALL
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  OR (current_setting('role'::text) = 'service_role'::text)
);

-- 3. Grant explicit permissions to service role for critical admin tables
GRANT ALL ON public.api_metrics TO service_role;
GRANT ALL ON public.api_usage_costs TO service_role;
GRANT ALL ON public.system_components TO service_role;
GRANT ALL ON public.microservices TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.platform_roles TO service_role;

-- 4. Create simplified admin dashboard function that edge functions can call
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS JSONB
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'user_stats', (
      SELECT jsonb_build_object(
        'total_users', COALESCE(COUNT(*), 0),
        'active_users', COALESCE(COUNT(*) FILTER (WHERE last_sign_in_at > now() - interval '7 days'), 0),
        'new_users_today', COALESCE(COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE), 0)
      )
      FROM public.profiles
    ),
    'api_metrics', (
      SELECT jsonb_build_object(
        'total_requests', COALESCE(COUNT(*), 0),
        'avg_cost', COALESCE(AVG(cost), 0),
        'total_tokens', COALESCE(SUM(tokens_used), 0)
      )
      FROM public.api_metrics
      WHERE created_at > now() - interval '24 hours'
    ),
    'system_health', (
      SELECT jsonb_build_object(
        'healthy_components', COALESCE(COUNT(*) FILTER (WHERE status = 'healthy'), 0),
        'total_components', COALESCE(COUNT(*), 0),
        'critical_issues', COALESCE(COUNT(*) FILTER (WHERE status != 'healthy'), 0)
      )
      FROM public.system_components
    )
  );
$$;

-- 5. Create simplified API metrics function for edge functions
CREATE OR REPLACE FUNCTION public.get_api_metrics_summary(time_range TEXT DEFAULT '24h')
RETURNS TABLE(
  total_requests BIGINT,
  total_cost NUMERIC,
  avg_response_time NUMERIC,
  success_rate NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMPTZ;
BEGIN
  -- Parse time range
  CASE time_range
    WHEN '1h' THEN start_time := now() - interval '1 hour';
    WHEN '24h' THEN start_time := now() - interval '24 hours';
    WHEN '7d' THEN start_time := now() - interval '7 days';
    WHEN '30d' THEN start_time := now() - interval '30 days';
    ELSE start_time := now() - interval '24 hours';
  END CASE;

  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*), 0)::BIGINT as total_requests,
    COALESCE(SUM(am.cost), 0)::NUMERIC as total_cost,
    COALESCE(AVG(am.latency), 0)::NUMERIC as avg_response_time,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE am.status BETWEEN 200 AND 299)::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 100
    END as success_rate
  FROM public.api_metrics am
  WHERE am.created_at >= start_time;
END;
$$;

-- 6. Create system health summary function
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS TABLE(
  total_components INTEGER,
  healthy_components INTEGER,
  critical_issues INTEGER,
  overall_status TEXT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(COUNT(*), 0)::INTEGER as total_components,
    COALESCE(COUNT(*) FILTER (WHERE status = 'healthy'), 0)::INTEGER as healthy_components,
    COALESCE(COUNT(*) FILTER (WHERE status != 'healthy'), 0)::INTEGER as critical_issues,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status != 'healthy') = 0 THEN 'healthy'
      WHEN COUNT(*) FILTER (WHERE status != 'healthy') <= COUNT(*) / 2 THEN 'warning'
      ELSE 'critical'
    END as overall_status
  FROM public.system_components;
$$;

-- Success message
SELECT 'Critical edge function permission fixes applied!' as status;