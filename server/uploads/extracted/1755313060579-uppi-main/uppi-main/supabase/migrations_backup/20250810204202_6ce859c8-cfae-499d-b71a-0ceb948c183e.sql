-- Grants for service role to ensure metrics logging from Edge Functions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT INSERT, SELECT ON TABLE public.api_metrics TO service_role;

-- Grant sequence permissions if an id sequence exists for api_metrics
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname = 'public'
      AND c.relname = 'api_metrics_id_seq'
  ) THEN
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.api_metrics_id_seq TO service_role';
  END IF;
END $$;

-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created_at
  ON public.api_metrics (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_status_created_at
  ON public.api_metrics (endpoint, status_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_metrics_status_created_at
  ON public.api_metrics (status_code, created_at DESC);
