-- Fix the trigger to handle the function call properly
DROP TRIGGER IF EXISTS update_competitor_analyses_updated_at ON public.competitor_analyses;

CREATE OR REPLACE FUNCTION public.update_competitor_analyses_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Only calculate score if we have meaningful analysis data
  IF NEW.analysis_data IS NOT NULL AND NEW.analysis_data != '{}'::jsonb AND NEW.analysis_data ? 'results' THEN
    BEGIN
      NEW.data_completeness_score = public.calculate_data_completeness_score(NEW);
    EXCEPTION WHEN OTHERS THEN
      -- If function fails, set a default score
      NEW.data_completeness_score = 50;
    END;
  ELSE
    -- For records without analysis data, set a lower base score
    NEW.data_completeness_score = COALESCE(NEW.data_completeness_score, 25);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_competitor_analyses_updated_at
    BEFORE INSERT OR UPDATE ON public.competitor_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_competitor_analyses_updated_at();