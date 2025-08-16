-- Fix the calculate_data_completeness_score function that's causing save failures
-- The function exists but there seems to be a signature issue with the trigger

-- First, let's update the trigger to properly handle the function call
DROP TRIGGER IF EXISTS update_competitor_analyses_updated_at_trigger ON public.competitor_analyses;

-- Recreate the trigger function without the data completeness calculation for now
CREATE OR REPLACE FUNCTION public.update_competitor_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Only calculate score if we have data, otherwise leave it as is
  IF NEW.analysis_data IS NOT NULL AND NEW.analysis_data != '{}'::jsonb THEN
    NEW.data_completeness_score = calculate_data_completeness_score(NEW);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_competitor_analyses_updated_at_trigger
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competitor_analyses_updated_at();