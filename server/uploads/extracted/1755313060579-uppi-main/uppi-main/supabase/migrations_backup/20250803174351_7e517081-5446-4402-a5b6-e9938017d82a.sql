-- Create the missing calculate_data_completeness_score function
CREATE OR REPLACE FUNCTION public.calculate_data_completeness_score(analysis_record public.competitor_analyses)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    score NUMERIC := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
    analysis_data_score NUMERIC := 0;
BEGIN
    -- Count total fields we're evaluating (12 basic fields + analysis_data)
    field_count := 13;
    
    -- Count filled basic fields
    IF analysis_record.name IS NOT NULL AND analysis_record.name != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.description IS NOT NULL AND analysis_record.description != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.website_url IS NOT NULL AND analysis_record.website_url != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.industry IS NOT NULL AND analysis_record.industry != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.headquarters IS NOT NULL AND analysis_record.headquarters != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.founded_year IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.employee_count IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.business_model IS NOT NULL AND analysis_record.business_model != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.target_market IS NOT NULL AND array_length(analysis_record.target_market, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.pricing_strategy IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.funding_info IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.revenue_estimate IS NOT NULL AND analysis_record.revenue_estimate > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Evaluate analysis_data completeness
    IF analysis_record.analysis_data IS NOT NULL THEN
        -- Check if analysis_data has meaningful content
        IF analysis_record.analysis_data ? 'results' AND 
           jsonb_array_length(analysis_record.analysis_data->'results') > 0 THEN
            analysis_data_score := 1;
        ELSIF jsonb_typeof(analysis_record.analysis_data) = 'object' AND 
              (analysis_record.analysis_data != '{}'::jsonb) THEN
            analysis_data_score := 0.5;
        END IF;
    END IF;
    
    -- Calculate percentage score (basic fields + analysis_data bonus)
    score := ((filled_count::NUMERIC / (field_count - 1)::NUMERIC) * 85) + (analysis_data_score * 15);
    
    -- Ensure score doesn't exceed 100
    IF score > 100 THEN
        score := 100;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$function$;

-- Recreate the trigger that uses this function
DROP TRIGGER IF EXISTS update_competitor_analyses_trigger ON public.competitor_analyses;

CREATE OR REPLACE FUNCTION public.update_competitor_analyses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  -- Only calculate score if we have data, otherwise leave it as is
  IF NEW.analysis_data IS NOT NULL AND NEW.analysis_data != '{}'::jsonb THEN
    NEW.data_completeness_score = calculate_data_completeness_score(NEW);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_competitor_analyses_trigger
    BEFORE UPDATE ON public.competitor_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_competitor_analyses_updated_at();