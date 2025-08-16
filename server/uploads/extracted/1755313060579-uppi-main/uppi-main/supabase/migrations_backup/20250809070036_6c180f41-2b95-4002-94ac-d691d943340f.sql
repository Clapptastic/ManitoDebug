-- Fix the search path security warning
CREATE OR REPLACE FUNCTION public.cleanup_old_analysis_runs()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete old runs, keeping only the 5 most recent per user per run_type
  DELETE FROM public.analysis_runs
  WHERE user_id = NEW.user_id 
    AND run_type = NEW.run_type
    AND id NOT IN (
      SELECT id
      FROM public.analysis_runs
      WHERE user_id = NEW.user_id 
        AND run_type = NEW.run_type
      ORDER BY created_at DESC
      LIMIT 5
    );
  
  RETURN NEW;
END;
$$;