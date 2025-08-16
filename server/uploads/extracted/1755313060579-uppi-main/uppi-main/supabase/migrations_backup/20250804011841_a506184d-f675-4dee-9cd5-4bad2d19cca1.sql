-- Fix the data completeness score calculation function
CREATE OR REPLACE FUNCTION public.calculate_data_completeness_score(analysis_record competitor_analyses)
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
    confidence_boost NUMERIC := 0;
BEGIN
    -- Count total fields we're evaluating (expanded to include more fields)
    field_count := 20;
    
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
    
    IF analysis_record.pricing_strategy IS NOT NULL AND analysis_record.pricing_strategy != '{}'::jsonb THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.funding_info IS NOT NULL AND analysis_record.funding_info != '{}'::jsonb THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.revenue_estimate IS NOT NULL AND analysis_record.revenue_estimate > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Check SWOT fields
    IF analysis_record.strengths IS NOT NULL AND array_length(analysis_record.strengths, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.weaknesses IS NOT NULL AND array_length(analysis_record.weaknesses, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.opportunities IS NOT NULL AND array_length(analysis_record.opportunities, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.threats IS NOT NULL AND array_length(analysis_record.threats, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Check competitive analysis fields
    IF analysis_record.competitive_advantages IS NOT NULL AND array_length(analysis_record.competitive_advantages, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.competitive_disadvantages IS NOT NULL AND array_length(analysis_record.competitive_disadvantages, 1) > 0 THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Check key personnel
    IF analysis_record.key_personnel IS NOT NULL AND analysis_record.key_personnel != '{}'::jsonb THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Check market position
    IF analysis_record.market_position IS NOT NULL AND analysis_record.market_position != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Evaluate analysis_data completeness with higher weight
    IF analysis_record.analysis_data IS NOT NULL THEN
        IF analysis_record.analysis_data ? 'source_citations' AND 
           jsonb_array_length(analysis_record.analysis_data->'source_citations') > 0 THEN
            analysis_data_score := 1;
        ELSIF jsonb_typeof(analysis_record.analysis_data) = 'object' AND 
              (analysis_record.analysis_data != '{}'::jsonb) THEN
            analysis_data_score := 0.5;
        END IF;
    END IF;
    
    -- Add confidence boost based on source citations and confidence scores
    IF analysis_record.source_citations IS NOT NULL AND jsonb_array_length(analysis_record.source_citations) > 0 THEN
        confidence_boost := confidence_boost + 10;
    END IF;
    
    IF analysis_record.confidence_scores IS NOT NULL AND analysis_record.confidence_scores != '{}'::jsonb THEN
        confidence_boost := confidence_boost + 5;
    END IF;
    
    -- Calculate percentage score with proper weighting
    score := ((filled_count::NUMERIC / field_count::NUMERIC) * 70) + (analysis_data_score * 20) + confidence_boost;
    
    -- Ensure score doesn't exceed 100 and is properly bounded
    IF score > 100 THEN
        score := 100;
    ELSIF score < 0 THEN
        score := 0;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$function$;

-- Update the existing analysis to recalculate its score
UPDATE competitor_analyses 
SET data_completeness_score = calculate_data_completeness_score(competitor_analyses.*)
WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'akclapp@gmail.com'
);