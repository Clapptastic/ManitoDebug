
-- Update enum types
DO $$ BEGIN
    -- Create competitor status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competitor_analysis_status') THEN
        CREATE TYPE competitor_analysis_status AS ENUM (
            'pending',
            'processing',
            'completed',
            'failed',
            'draft',
            'partial'
        );
    END IF;

    -- Create growth stage enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competitor_growth_stage') THEN
        CREATE TYPE competitor_growth_stage AS ENUM (
            'startup',
            'growth',
            'mature',
            'decline'
        );
    END IF;

    -- Create position type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_position_type') THEN
        CREATE TYPE market_position_type AS ENUM (
            'leader',
            'challenger',
            'follower',
            'niche'
        );
    END IF;
END $$;

-- Add computed column for total data quality
ALTER TABLE competitor_analyses DROP COLUMN IF EXISTS computed_data_quality;
ALTER TABLE competitor_analyses 
ADD COLUMN computed_data_quality numeric 
GENERATED ALWAYS AS (
    CASE 
        WHEN data_quality_score IS NULL THEN 0
        ELSE data_quality_score
    END
) STORED;

-- Add function to validate competitor analysis data
CREATE OR REPLACE FUNCTION validate_competitor_json()
RETURNS trigger AS $$
BEGIN
    -- Ensure jsonb fields are valid
    IF NEW.performance_metrics IS NULL THEN
        NEW.performance_metrics := '{}'::jsonb;
    END IF;
    
    IF NEW.platform_presence IS NULL THEN
        NEW.platform_presence := '{}'::jsonb;
    END IF;
    
    -- Ensure array fields are valid as jsonb arrays
    IF NEW.primary_channels IS NULL THEN
        NEW.primary_channels := '[]'::jsonb;
    END IF;
    
    IF NEW.competitive_strengths IS NULL THEN
        NEW.competitive_strengths := '[]'::jsonb;
    END IF;
    
    IF NEW.customer_sentiment IS NULL THEN
        NEW.customer_sentiment := '[]'::jsonb;
    END IF;
    
    IF NEW.target_segments IS NULL THEN
        NEW.target_segments := '[]'::jsonb;
    END IF;
    
    IF NEW.target_audience IS NULL THEN
        NEW.target_audience := '[]'::jsonb;
    END IF;
    
    -- Ensure numeric fields have valid values
    IF NEW.channel_effectiveness_score IS NULL THEN
        NEW.channel_effectiveness_score := 0;
    END IF;
    
    IF NEW.computed_data_quality IS NULL THEN
        NEW.computed_data_quality := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_competitor_analysis_data_trigger ON competitor_analyses;
CREATE TRIGGER validate_competitor_analysis_data_trigger
    BEFORE INSERT OR UPDATE ON competitor_analyses
    FOR EACH ROW
    EXECUTE FUNCTION validate_competitor_json();
