-- Add triggers for analysis_runs to auto-update updated_at and retain only the 5 most recent runs per user/run_type
-- This migration is idempotent: it drops existing triggers (if any) before recreating them.

-- Ensure the helper functions exist (they already exist per current schema), referenced here for clarity:
--   public.update_updated_at_column()
--   public.cleanup_old_analysis_runs()

-- 1) Auto-update updated_at on UPDATE
DROP TRIGGER IF EXISTS update_analysis_runs_updated_at ON public.analysis_runs;
CREATE TRIGGER update_analysis_runs_updated_at
BEFORE UPDATE ON public.analysis_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Keep only 5 most recent runs per user per run_type after each INSERT
DROP TRIGGER IF EXISTS cleanup_old_analysis_runs_trigger ON public.analysis_runs;
CREATE TRIGGER cleanup_old_analysis_runs_trigger
AFTER INSERT ON public.analysis_runs
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_analysis_runs();

-- Documentation
COMMENT ON TRIGGER update_analysis_runs_updated_at ON public.analysis_runs IS
  'Automatically sets updated_at = now() before each update to analysis_runs.';

COMMENT ON TRIGGER cleanup_old_analysis_runs_trigger ON public.analysis_runs IS
  'After inserting a new analysis run, prune older runs keeping only the latest 5 per user per run_type.';