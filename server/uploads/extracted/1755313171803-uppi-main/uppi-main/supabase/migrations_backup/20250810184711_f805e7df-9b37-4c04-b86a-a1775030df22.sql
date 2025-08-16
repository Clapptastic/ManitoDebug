-- Create api_metrics table for consolidated API observability
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  provider TEXT NULL,
  endpoint TEXT NULL,
  status_code INTEGER NULL,
  response_time_ms INTEGER NULL,
  tokens_used INTEGER NULL,
  cost_usd NUMERIC(10,4) NULL,
  request_id TEXT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
-- Service role can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'api_metrics' AND policyname = 'Service role can insert api_metrics'
  ) THEN
    CREATE POLICY "Service role can insert api_metrics"
    ON public.api_metrics
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- Users can select their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'api_metrics' AND policyname = 'Users can select own api_metrics'
  ) THEN
    CREATE POLICY "Users can select own api_metrics"
    ON public.api_metrics
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can select all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'api_metrics' AND policyname = 'Admins can select all api_metrics'
  ) THEN
    CREATE POLICY "Admins can select all api_metrics"
    ON public.api_metrics
    FOR SELECT
    USING (public.is_admin_user(auth.uid()));
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_at ON public.api_metrics (created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created ON public.api_metrics (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_provider_created ON public.api_metrics (provider, created_at);
