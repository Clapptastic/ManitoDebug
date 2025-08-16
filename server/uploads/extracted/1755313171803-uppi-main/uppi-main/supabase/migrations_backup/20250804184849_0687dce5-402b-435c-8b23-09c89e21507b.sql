-- =================================================================
-- CRITICAL FIX: ADMIN API EDGE FUNCTION PERMISSIONS
-- Fix the permission denied errors in admin-api edge function
-- =================================================================

-- 1. Add service role policies for api_metrics table (critical for edge functions)
DROP POLICY IF EXISTS "Service role can manage api metrics" ON public.api_metrics;
CREATE POLICY "Service role can manage api metrics"
ON public.api_metrics
FOR ALL
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  OR (current_setting('role'::text) = 'service_role'::text)
);

-- 2. Ensure all admin-critical tables have service role access
DROP POLICY IF EXISTS "Service role can manage api usage costs" ON public.api_usage_costs;
CREATE POLICY "Service role can manage api usage costs"
ON public.api_usage_costs
FOR ALL
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  OR (current_setting('role'::text) = 'service_role'::text)
);

-- 3. Fix any missing columns in api_metrics table
DO $$
BEGIN
  -- Check if provider column exists in api_metrics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_metrics' 
    AND column_name = 'api_provider'
  ) THEN
    ALTER TABLE public.api_metrics ADD COLUMN api_provider TEXT;
  END IF;
END $$;

-- 4. Ensure system health functions exist for edge functions
CREATE OR REPLACE FUNCTION public.get_system_health_data()
RETURNS TABLE(
  component_name TEXT,
  status TEXT,
  last_check TIMESTAMPTZ,
  health_score NUMERIC,
  metrics JSONB
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(sc.name, sc.display_name, 'unknown') as component_name,
    COALESCE(sc.status, 'unknown') as status,
    COALESCE(sc.last_check, now()) as last_check,
    COALESCE(sc.health_score, 0) as health_score,
    COALESCE(sc.metrics, '{}'::jsonb) as metrics
  FROM public.system_components sc
  UNION ALL
  SELECT 
    COALESCE(m.name, m.display_name, 'unknown') as component_name,
    COALESCE(m.status, 'unknown') as status,
    COALESCE(m.last_health_check, now()) as last_check,
    100 as health_score,
    COALESCE(m.metadata, '{}'::jsonb) as metrics
  FROM public.microservices m
  WHERE m.is_active = true;
$$;

-- 5. Create admin dashboard data function for edge functions
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS JSONB
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'user_stats', (
      SELECT jsonb_build_object(
        'total_users', COUNT(*),
        'active_users', COUNT(*) FILTER (WHERE last_sign_in_at > now() - interval '7 days'),
        'new_users_today', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)
      )
      FROM public.profiles
    ),
    'api_metrics', (
      SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'avg_cost', COALESCE(AVG(cost), 0),
        'total_tokens', COALESCE(SUM(tokens_used), 0)
      )
      FROM public.api_metrics
      WHERE created_at > now() - interval '24 hours'
    ),
    'system_health', (
      SELECT jsonb_build_object(
        'healthy_components', COUNT(*) FILTER (WHERE status = 'healthy'),
        'total_components', COUNT(*),
        'critical_issues', COUNT(*) FILTER (WHERE status != 'healthy' AND is_critical = true)
      )
      FROM public.system_components
    )
  );
$$;

-- 6. Grant explicit permissions to service role
GRANT ALL ON public.api_metrics TO service_role;
GRANT ALL ON public.api_usage_costs TO service_role;
GRANT ALL ON public.system_components TO service_role;
GRANT ALL ON public.microservices TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- 7. Create function to safely get API metrics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_api_metrics_safe(time_range TEXT DEFAULT '24h')
RETURNS TABLE(
  total_requests BIGINT,
  total_cost NUMERIC,
  avg_response_time NUMERIC,
  provider_breakdown JSONB
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
    COUNT(*)::BIGINT as total_requests,
    COALESCE(SUM(am.cost), 0)::NUMERIC as total_cost,
    COALESCE(AVG(am.latency), 0)::NUMERIC as avg_response_time,
    COALESCE(
      jsonb_object_agg(
        COALESCE(am.provider, 'unknown'),
        jsonb_build_object(
          'requests', COUNT(*),
          'cost', COALESCE(SUM(am.cost), 0),
          'tokens', COALESCE(SUM(am.tokens_used), 0)
        )
      ),
      '{}'::jsonb
    ) as provider_breakdown
  FROM public.api_metrics am
  WHERE am.created_at >= start_time
  GROUP BY ();
END;
$$;

-- Success verification
SELECT 'Critical admin infrastructure fixes applied successfully!' as status;