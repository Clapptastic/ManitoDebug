-- Create trigger to keep only last 5 analysis_runs per user per run_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_analysis_runs'
  ) THEN
    CREATE TRIGGER trg_cleanup_analysis_runs
    AFTER INSERT ON public.analysis_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_old_analysis_runs();
  END IF;
END $$;