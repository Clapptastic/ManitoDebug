-- Create the missing calculate_data_completeness_score function
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(analysis_row competitor_analyses)
RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
BEGIN
    -- Count total fields
    field_count := 12;
    
    -- Count filled fields
    IF analysis_row.name IS NOT NULL AND analysis_row.name != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.description IS NOT NULL AND analysis_row.description != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.website_url IS NOT NULL AND analysis_row.website_url != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.industry IS NOT NULL AND analysis_row.industry != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.headquarters IS NOT NULL AND analysis_row.headquarters != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.founded_year IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.employee_count IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.business_model IS NOT NULL AND analysis_row.business_model != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.target_market IS NOT NULL AND analysis_row.target_market != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.pricing_strategy IS NOT NULL AND analysis_row.pricing_strategy != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.funding_info IS NOT NULL AND analysis_row.funding_info != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_row.analysis_data IS NOT NULL THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Calculate percentage score
    IF field_count > 0 THEN
        score := (filled_count::NUMERIC / field_count::NUMERIC) * 100;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql STABLE;