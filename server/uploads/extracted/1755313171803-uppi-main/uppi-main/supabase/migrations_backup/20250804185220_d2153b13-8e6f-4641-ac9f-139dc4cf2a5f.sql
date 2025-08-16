-- =================================================================
-- MINIMAL CRITICAL FIX: EDGE FUNCTION PERMISSIONS
-- Fix only the critical permission denied errors for admin-api
-- =================================================================

-- 1. Add service role policies for api_metrics table (CRITICAL FIX)
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

-- 4. Create a simple admin data function with correct column names
CREATE OR REPLACE FUNCTION public.get_admin_data()
RETURNS JSONB
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'users', (
      SELECT jsonb_build_object(
        'total', COALESCE(COUNT(*), 0)
      )
      FROM public.profiles
    ),
    'api_requests', (
      SELECT jsonb_build_object(
        'total_today', COALESCE(COUNT(*), 0),
        'total_cost', COALESCE(SUM(cost), 0)
      )
      FROM public.api_metrics
      WHERE created_at::date = CURRENT_DATE
    )
  );
$$;

-- Success message
SELECT 'Critical API permissions fixed for edge functions!' as status;