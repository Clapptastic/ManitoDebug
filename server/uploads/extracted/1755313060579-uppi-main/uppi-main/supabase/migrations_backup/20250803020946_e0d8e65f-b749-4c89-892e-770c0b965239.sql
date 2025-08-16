-- Drop the incorrectly created trigger
DROP TRIGGER IF EXISTS update_data_completeness_trigger ON public.competitor_analyses;

-- Create the correct trigger that actually uses the data completeness score function
CREATE OR REPLACE FUNCTION public.update_data_completeness_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  NEW.data_completeness_score := calculate_data_completeness_score(NEW);
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER update_data_completeness_trigger
  BEFORE INSERT OR UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_data_completeness_trigger();