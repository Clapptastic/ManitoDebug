-- Create the missing calculate_data_completeness_score function
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(analysis competitor_analyses)
RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
    total_fields INTEGER := 0;
    filled_fields INTEGER := 0;
BEGIN
    -- Count total important fields
    total_fields := 15;
    
    -- Count filled fields
    IF analysis.name IS NOT NULL AND analysis.name != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.website_url IS NOT NULL AND analysis.website_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.industry IS NOT NULL AND analysis.industry != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.headquarters IS NOT NULL AND analysis.headquarters != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.founded_year IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.employee_count IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.business_model IS NOT NULL AND analysis.business_model != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.market_position IS NOT NULL AND analysis.market_position != '' THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.revenue_estimate IS NOT NULL AND analysis.revenue_estimate > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.strengths IS NOT NULL AND array_length(analysis.strengths, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.weaknesses IS NOT NULL AND array_length(analysis.weaknesses, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.opportunities IS NOT NULL AND array_length(analysis.opportunities, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.threats IS NOT NULL AND array_length(analysis.threats, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.competitive_advantages IS NOT NULL AND array_length(analysis.competitive_advantages, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF analysis.target_market IS NOT NULL AND array_length(analysis.target_market, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    
    -- Calculate percentage score
    IF total_fields > 0 THEN
        score := (filled_fields::NUMERIC / total_fields::NUMERIC) * 100;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;