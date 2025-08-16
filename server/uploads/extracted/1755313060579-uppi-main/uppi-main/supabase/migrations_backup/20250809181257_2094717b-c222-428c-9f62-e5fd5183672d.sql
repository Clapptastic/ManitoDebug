-- Competitor Analysis – DB hardening for production readiness
-- 1) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_created ON public.competitor_analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_session_user ON public.competitor_analysis_progress (session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_run_created ON public.analysis_runs (user_id, run_type, created_at DESC);

-- 2) Updated_at and cleanup triggers (use existing helper functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_analysis_runs_updated_at'
  ) THEN
    CREATE TRIGGER update_analysis_runs_updated_at
    BEFORE UPDATE ON public.analysis_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_progress_updated_at'
  ) THEN
    CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON public.competitor_analysis_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_old_analysis_runs_trigger'
  ) THEN
    CREATE TRIGGER cleanup_old_analysis_runs_trigger
    AFTER INSERT ON public.analysis_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_old_analysis_runs();
  END IF;
END$$;

-- 3) Realtime config for competitor_analysis_progress
ALTER TABLE public.competitor_analysis_progress REPLICA IDENTITY FULL;

DO $pub$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'competitor_analysis_progress'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.competitor_analysis_progress';
  END IF;
END
$pub$;

-- 4) Data integrity – set NOT NULL on competitor_analyses.user_id when safe
DO $$
DECLARE v_nulls integer;
BEGIN
  SELECT COUNT(*) INTO v_nulls FROM public.competitor_analyses WHERE user_id IS NULL;
  IF v_nulls = 0 THEN
    ALTER TABLE public.competitor_analyses ALTER COLUMN user_id SET NOT NULL;
  END IF;
END$$;