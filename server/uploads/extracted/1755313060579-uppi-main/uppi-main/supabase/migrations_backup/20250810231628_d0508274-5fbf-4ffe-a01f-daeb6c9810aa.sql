-- Create utility function for updating updated_at if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Data validation logs for master profiles
CREATE TABLE IF NOT EXISTS public.data_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  user_id UUID NULL,
  data_field TEXT NOT NULL,
  original_value TEXT NULL,
  validated_value TEXT NULL,
  validation_source TEXT NOT NULL,
  validation_method TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  confidence_score NUMERIC NULL,
  discrepancy_reason TEXT NULL,
  external_source_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_validation_logs ENABLE ROW LEVEL SECURITY;

-- Policies: service role insert; admins select; service role select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'dvl_service_insert'
  ) THEN
    CREATE POLICY "dvl_service_insert"
    ON public.data_validation_logs
    FOR INSERT
    TO public
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'dvl_admin_select'
  ) THEN
    CREATE POLICY "dvl_admin_select"
    ON public.data_validation_logs
    FOR SELECT
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role'));
  END IF;
END $$;

-- 2) Confidence history for master profiles
CREATE TABLE IF NOT EXISTS public.confidence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  data_field TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  contributing_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_calculation_method TEXT NULL,
  triggered_by TEXT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.confidence_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'ch_service_insert'
  ) THEN
    CREATE POLICY "ch_service_insert"
    ON public.confidence_history
    FOR INSERT
    TO public
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'ch_admin_select'
  ) THEN
    CREATE POLICY "ch_admin_select"
    ON public.confidence_history
    FOR SELECT
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role'));
  END IF;
END $$;

-- 3) Master profile merges history
CREATE TABLE IF NOT EXISTS public.master_profile_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  source_analysis_id UUID NULL,
  merge_type TEXT NOT NULL,
  fields_updated TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence_changes JSONB NULL,
  merge_algorithm TEXT NULL,
  data_quality_before NUMERIC NULL,
  data_quality_after NUMERIC NULL,
  conflicts_resolved INTEGER NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID NULL,
  merge_notes TEXT NULL,
  rollback_data JSONB NULL
);

ALTER TABLE public.master_profile_merges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'mpm_service_insert'
  ) THEN
    CREATE POLICY "mpm_service_insert"
    ON public.master_profile_merges
    FOR INSERT
    TO public
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'mpm_admin_select'
  ) THEN
    CREATE POLICY "mpm_admin_select"
    ON public.master_profile_merges
    FOR SELECT
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role'));
  END IF;
END $$;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_dvl_master_profile_id ON public.data_validation_logs(master_profile_id);
CREATE INDEX IF NOT EXISTS idx_ch_master_profile_id ON public.confidence_history(master_profile_id);
CREATE INDEX IF NOT EXISTS idx_mpm_master_profile_id ON public.master_profile_merges(master_profile_id);

-- 4) Source authority weights
CREATE TABLE IF NOT EXISTS public.source_authority_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  data_category TEXT NOT NULL,
  authority_weight NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_authority_weights_unique UNIQUE (source_name, data_category)
);

ALTER TABLE public.source_authority_weights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'saw_admin_all'
  ) THEN
    CREATE POLICY "saw_admin_all"
    ON public.source_authority_weights
    FOR ALL
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role'))
    WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'saw_service_select'
  ) THEN
    CREATE POLICY "saw_service_select"
    ON public.source_authority_weights
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS tr_saw_updated_at ON public.source_authority_weights;
CREATE TRIGGER tr_saw_updated_at
BEFORE UPDATE ON public.source_authority_weights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some defaults if table empty
INSERT INTO public.source_authority_weights (source_name, data_category, authority_weight)
SELECT * FROM (
  VALUES
    ('sec_edgar','financial', 0.95),
    ('crunchbase','basic_info', 0.8),
    ('linkedin_company','personnel', 0.75),
    ('company_website','basic_info', 0.7),
    ('ai_analysis','basic_info', 0.6)
) AS v(source_name, data_category, authority_weight)
WHERE NOT EXISTS (SELECT 1 FROM public.source_authority_weights);
