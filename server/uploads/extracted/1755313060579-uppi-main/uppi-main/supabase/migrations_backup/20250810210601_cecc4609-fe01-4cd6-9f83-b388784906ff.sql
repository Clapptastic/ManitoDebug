-- Create enums if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provenance_source') THEN
    CREATE TYPE public.provenance_source AS ENUM ('api', 'master_profile', 'user_input', 'inferred');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_status') THEN
    CREATE TYPE public.provider_status AS ENUM ('pending', 'running', 'completed', 'failed');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.analysis_provider_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status provider_status NOT NULL DEFAULT 'pending',
  cost_usd NUMERIC NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analysis_provider_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.analysis_provider_runs(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  normalized_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_result JSONB,
  quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  coverage_score NUMERIC,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analysis_combined (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  aggregated_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  field_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  filled_from_master JSONB NOT NULL DEFAULT '[]'::jsonb,
  can_contribute_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_confidence NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_runs_analysis ON public.analysis_provider_runs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_provider_runs_user ON public.analysis_provider_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_runs_provider ON public.analysis_provider_runs(provider);

CREATE INDEX IF NOT EXISTS idx_provider_results_analysis ON public.analysis_provider_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_provider_results_user ON public.analysis_provider_results(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_results_provider ON public.analysis_provider_results(provider);
CREATE INDEX IF NOT EXISTS idx_provider_results_normalized_gin ON public.analysis_provider_results USING GIN (normalized_result);

CREATE INDEX IF NOT EXISTS idx_combined_analysis ON public.analysis_combined(analysis_id);
CREATE INDEX IF NOT EXISTS idx_combined_user ON public.analysis_combined(user_id);
CREATE INDEX IF NOT EXISTS idx_combined_agg_gin ON public.analysis_combined USING GIN (aggregated_result);

-- RLS enable
ALTER TABLE public.analysis_provider_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_provider_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_combined ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_provider_runs' AND policyname='runs_user_manage'
  ) THEN
    EXECUTE 'DROP POLICY "runs_user_manage" ON public.analysis_provider_runs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_provider_results' AND policyname='results_user_manage'
  ) THEN
    EXECUTE 'DROP POLICY "results_user_manage" ON public.analysis_provider_results';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_combined' AND policyname='combined_user_manage'
  ) THEN
    EXECUTE 'DROP POLICY "combined_user_manage" ON public.analysis_combined';
  END IF;
END $$;

CREATE POLICY "runs_user_manage" ON public.analysis_provider_runs
  FOR ALL USING (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  ) WITH CHECK (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  );

CREATE POLICY "results_user_manage" ON public.analysis_provider_results
  FOR ALL USING (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  ) WITH CHECK (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  );

CREATE POLICY "combined_user_manage" ON public.analysis_combined
  FOR ALL USING (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  ) WITH CHECK (
    user_id = auth.uid() OR auth.role() = 'service_role' OR public.is_admin_user(auth.uid())
  );

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_runs_updated_at ON public.analysis_provider_runs;
CREATE TRIGGER trg_runs_updated_at BEFORE UPDATE ON public.analysis_provider_runs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_results_updated_at ON public.analysis_provider_results;
CREATE TRIGGER trg_results_updated_at BEFORE UPDATE ON public.analysis_provider_results
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_combined_updated_at ON public.analysis_combined;
CREATE TRIGGER trg_combined_updated_at BEFORE UPDATE ON public.analysis_combined
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- View
CREATE OR REPLACE VIEW public.v_competitor_analysis_full AS
SELECT 
  ca.id AS analysis_id,
  ca.user_id,
  ca.name,
  ca.status,
  ca.analysis_data,
  ac.aggregated_result,
  ac.provenance_map,
  ac.field_scores,
  ac.filled_from_master,
  ac.overall_confidence,
  ca.created_at,
  ca.updated_at
FROM public.competitor_analyses ca
LEFT JOIN public.analysis_combined ac ON ac.analysis_id = ca.id;

-- Comments
COMMENT ON TABLE public.analysis_combined IS 'Aggregated competitor analysis per analysis_id. Fields filled from master_profile must be marked in provenance_map with source=master_profile and can_contribute=false.';
COMMENT ON TABLE public.analysis_provider_results IS 'Per provider normalized and raw results with quality metrics per analysis run.';
COMMENT ON TABLE public.analysis_provider_runs IS 'Per provider attempts with costs, tokens, and status per analysis_id.';