-- Fix policies (no IF NOT EXISTS). Re-run only the policy/rls section safely.

-- Ensure RLS enabled
ALTER TABLE public.analysis_provider_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_provider_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_combined ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present, then recreate
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