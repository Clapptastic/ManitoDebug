
-- Ensure enum types exist and are correct
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competitor_status') THEN
        CREATE TYPE competitor_status AS ENUM (
            'pending',
            'processing',
            'completed',
            'failed',
            'draft',
            'partial'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competitor_growth_stage') THEN
        CREATE TYPE competitor_growth_stage AS ENUM (
            'startup',
            'growth',
            'mature',
            'decline'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_position_type') THEN
        CREATE TYPE market_position_type AS ENUM (
            'leader',
            'challenger',
            'follower',
            'niche'
        );
    END IF;
END $$;

-- Add type validation function
CREATE OR REPLACE FUNCTION validate_competitor_types()
RETURNS trigger AS $$
BEGIN
    -- Ensure all required jsonb fields have proper structure
    IF NEW.company_overview IS NOT NULL AND NOT (jsonb_typeof(NEW.company_overview) = 'object') THEN
        RAISE EXCEPTION 'company_overview must be a JSON object';
    END IF;

    IF NEW.market_position IS NOT NULL AND NOT (jsonb_typeof(NEW.market_position) = 'object') THEN
        RAISE EXCEPTION 'market_position must be a JSON object';
    END IF;

    IF NEW.performance_metrics IS NULL THEN
        NEW.performance_metrics := jsonb_build_object(
            'revenue_growth', 0,
            'market_share_growth', 0,
            'customer_satisfaction', 0,
            'brand_awareness', 0,
            'channel_effectiveness', 0,
            'competitor_strength', 0
        );
    END IF;

    IF NEW.market_indicators IS NULL THEN
        NEW.market_indicators := jsonb_build_object(
            'market_saturation', 0,
            'entry_barriers', 0,
            'growth_potential', 0,
            'competitive_intensity', 0,
            'technology_adoption', 0
        );
    END IF;

    IF NEW.data_aggregation_metrics IS NULL THEN
        NEW.data_aggregation_metrics := jsonb_build_object(
            'data_completeness', 0,
            'data_accuracy', 0,
            'data_freshness', 0,
            'source_reliability', 0,
            'coverage_score', 0
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for type validation
DROP TRIGGER IF EXISTS validate_competitor_types_trigger ON competitor_analyses;
CREATE TRIGGER validate_competitor_types_trigger
    BEFORE INSERT OR UPDATE ON competitor_analyses
    FOR EACH ROW
    EXECUTE FUNCTION validate_competitor_types();

-- Update existing competitor_analyses table structure
ALTER TABLE competitor_analyses
    ALTER COLUMN status TYPE competitor_status USING status::competitor_status,
    ALTER COLUMN growth_stage TYPE competitor_growth_stage USING growth_stage::competitor_growth_stage,
    ALTER COLUMN position_type TYPE market_position_type USING position_type::market_position_type;

-- Add computed columns for data quality metrics
ALTER TABLE competitor_analyses 
    ADD COLUMN IF NOT EXISTS computed_data_quality numeric GENERATED ALWAYS AS (
        CASE 
            WHEN data_aggregation_metrics IS NULL THEN 0
            ELSE (data_aggregation_metrics->>'data_completeness')::numeric
        END
    ) STORED;

-- Update existing null values to proper defaults
UPDATE competitor_analyses
SET 
    performance_metrics = COALESCE(performance_metrics, '{}'::jsonb),
    market_indicators = COALESCE(market_indicators, '{}'::jsonb),
    data_aggregation_metrics = COALESCE(data_aggregation_metrics, '{}'::jsonb);

