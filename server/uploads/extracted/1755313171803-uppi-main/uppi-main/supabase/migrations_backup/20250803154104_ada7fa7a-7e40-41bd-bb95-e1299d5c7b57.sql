-- Drop the existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS calculate_data_completeness_score(competitor_analyses);

-- Recreate the function with the correct parameter name
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(analysis_record competitor_analyses)
RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
BEGIN
    -- Count total fields
    field_count := 12;
    
    -- Count filled fields
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
    
    IF analysis_record.target_market IS NOT NULL AND analysis_record.target_market != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.pricing_strategy IS NOT NULL AND analysis_record.pricing_strategy != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.funding_info IS NOT NULL AND analysis_record.funding_info != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.analysis_data IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Calculate percentage score
    IF field_count > 0 THEN
        score := (filled_count::NUMERIC / field_count::NUMERIC) * 100;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql STABLE;