-- Drop the incorrectly created trigger
DROP TRIGGER IF EXISTS update_data_completeness_trigger ON public.competitor_analyses;

-- Create the correct trigger that calls the data completeness function
CREATE TRIGGER update_data_completeness_trigger
  BEFORE INSERT OR UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_data_completeness_trigger();