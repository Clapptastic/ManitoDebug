-- Drop existing trigger that references the missing function
DROP TRIGGER IF EXISTS update_data_completeness_trigger ON public.competitor_analyses;

-- Create the missing calculate_data_completeness_score function
CREATE OR REPLACE FUNCTION public.calculate_data_completeness_score(analysis_record competitor_analyses)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $function$
DECLARE
  score numeric := 0;
BEGIN
  -- Core company information (4 points each)
  IF analysis_record.name IS NOT NULL AND length(analysis_record.name) > 0 THEN score := score + 4; END IF;
  IF analysis_record.description IS NOT NULL AND length(analysis_record.description) > 0 THEN score := score + 4; END IF;
  IF analysis_record.website_url IS NOT NULL AND length(analysis_record.website_url) > 0 THEN score := score + 4; END IF;
  IF analysis_record.industry IS NOT NULL AND length(analysis_record.industry) > 0 THEN score := score + 4; END IF;
  IF analysis_record.headquarters IS NOT NULL AND length(analysis_record.headquarters) > 0 THEN score := score + 4; END IF;
  
  -- Business metrics (4 points each)
  IF analysis_record.founded_year IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.employee_count IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.market_position IS NOT NULL AND length(analysis_record.market_position) > 0 THEN score := score + 4; END IF;
  IF analysis_record.business_model IS NOT NULL AND length(analysis_record.business_model) > 0 THEN score := score + 4; END IF;
  
  -- SWOT Analysis (4 points each)
  IF analysis_record.strengths IS NOT NULL AND array_length(analysis_record.strengths, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.weaknesses IS NOT NULL AND array_length(analysis_record.weaknesses, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.opportunities IS NOT NULL AND array_length(analysis_record.opportunities, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.threats IS NOT NULL AND array_length(analysis_record.threats, 1) > 0 THEN score := score + 4; END IF;
  
  -- Market and strategy data (4 points each)
  IF analysis_record.target_market IS NOT NULL AND array_length(analysis_record.target_market, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.pricing_strategy IS NOT NULL AND jsonb_typeof(analysis_record.pricing_strategy) = 'object' AND analysis_record.pricing_strategy != '{}'::jsonb THEN score := score + 4; END IF;
  IF analysis_record.funding_info IS NOT NULL AND jsonb_typeof(analysis_record.funding_info) = 'object' AND analysis_record.funding_info != '{}'::jsonb THEN score := score + 4; END IF;
  
  -- Enhanced data fields (4 points each)
  IF analysis_record.competitive_advantages IS NOT NULL AND array_length(analysis_record.competitive_advantages, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.customer_segments IS NOT NULL AND array_length(analysis_record.customer_segments, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.geographic_presence IS NOT NULL AND array_length(analysis_record.geographic_presence, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.product_portfolio IS NOT NULL AND jsonb_typeof(analysis_record.product_portfolio) = 'object' AND analysis_record.product_portfolio != '{}'::jsonb THEN score := score + 4; END IF;
  IF analysis_record.technology_analysis IS NOT NULL AND jsonb_typeof(analysis_record.technology_analysis) = 'object' AND analysis_record.technology_analysis != '{}'::jsonb THEN score := score + 4; END IF;
  IF analysis_record.financial_metrics IS NOT NULL AND jsonb_typeof(analysis_record.financial_metrics) = 'object' AND analysis_record.financial_metrics != '{}'::jsonb THEN score := score + 4; END IF;
  IF analysis_record.key_personnel IS NOT NULL AND jsonb_typeof(analysis_record.key_personnel) = 'object' AND analysis_record.key_personnel != '{}'::jsonb THEN score := score + 4; END IF;
  IF analysis_record.partnerships IS NOT NULL AND array_length(analysis_record.partnerships, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.source_citations IS NOT NULL AND jsonb_array_length(analysis_record.source_citations) > 0 THEN score := score + 4; END IF;
  
  RETURN score;
END;
$function$;

-- Recreate the trigger with the correct function
CREATE TRIGGER update_data_completeness_trigger
  BEFORE INSERT OR UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_data_completeness_trigger();