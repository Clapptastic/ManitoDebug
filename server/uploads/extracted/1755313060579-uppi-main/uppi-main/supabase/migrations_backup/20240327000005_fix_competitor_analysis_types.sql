
-- Add API related metrics tables
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  query_cost NUMERIC DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  endpoint TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to competitor_analyses
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS api_sources JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS api_attribution_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS promotional_efforts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS data_gathering_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT jsonb_build_object(
  'revenue_growth', 0,
  'market_share_growth', 0,
  'customer_satisfaction', 0,
  'brand_awareness', 0,
  'channel_effectiveness', 0,
  'competitor_strength', 0
),
ADD COLUMN IF NOT EXISTS market_indicators JSONB DEFAULT jsonb_build_object(
  'market_saturation', 0,
  'entry_barriers', 0,
  'growth_potential', 0,
  'competitive_intensity', 0,
  'technology_adoption', 0
),
ADD COLUMN IF NOT EXISTS data_aggregation_metrics JSONB DEFAULT jsonb_build_object(
  'data_completeness', 0,
  'data_accuracy', 0,
  'data_freshness', 0,
  'source_reliability', 0,
  'coverage_score', 0
),
ADD COLUMN IF NOT EXISTS channel_effectiveness_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS primary_channels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitive_strengths JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS platform_presence JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_sentiment JSONB DEFAULT '[]'::jsonb;

-- Create function to validate competitor analysis data
CREATE OR REPLACE FUNCTION validate_competitor_analysis_data()
RETURNS trigger AS $$
BEGIN
  -- Ensure numeric fields have valid defaults
  NEW.channel_effectiveness_score := COALESCE(NEW.channel_effectiveness_score, 0);
  NEW.data_quality_score := COALESCE(NEW.data_quality_score, 0);
  NEW.market_presence_score := COALESCE(NEW.market_presence_score, 0);
  
  -- Ensure JSONB arrays have valid structure
  IF NEW.promotional_efforts IS NULL THEN
    NEW.promotional_efforts := '[]'::jsonb;
  END IF;
  
  IF NEW.tech_stack IS NULL THEN
    NEW.tech_stack := '[]'::jsonb;
  END IF;
  
  IF NEW.data_gathering_methods IS NULL THEN
    NEW.data_gathering_methods := '[]'::jsonb;
  END IF;
  
  IF NEW.sources IS NULL THEN
    NEW.sources := '[]'::jsonb;
  END IF;
  
  -- Ensure JSONB objects have valid structure
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

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_competitor_analysis_data_trigger ON competitor_analyses;
CREATE TRIGGER validate_competitor_analysis_data_trigger
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION validate_competitor_analysis_data();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_api_sources ON competitor_analyses USING gin(api_sources);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_performance_metrics ON competitor_analyses USING gin(performance_metrics);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_market_indicators ON competitor_analyses USING gin(market_indicators);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_data_aggregation_metrics ON competitor_analyses USING gin(data_aggregation_metrics);

-- Add enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE api_provider_type AS ENUM ('openai', 'anthropic', 'perplexity', 'gemini');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE competitor_analysis_status AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'draft',
        'partial'
    );
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Update existing rows to ensure all new columns have valid values
UPDATE competitor_analyses
SET 
  api_sources = COALESCE(api_sources, '{}'::jsonb),
  api_attribution_info = COALESCE(api_attribution_info, '{}'::jsonb),
  promotional_efforts = COALESCE(promotional_efforts, '[]'::jsonb),
  tech_stack = COALESCE(tech_stack, '[]'::jsonb),
  data_gathering_methods = COALESCE(data_gathering_methods, '[]'::jsonb),
  sources = COALESCE(sources, '[]'::jsonb),
  performance_metrics = COALESCE(performance_metrics, jsonb_build_object(
    'revenue_growth', 0,
    'market_share_growth', 0,
    'customer_satisfaction', 0,
    'brand_awareness', 0,
    'channel_effectiveness', 0,
    'competitor_strength', 0
  )),
  market_indicators = COALESCE(market_indicators, jsonb_build_object(
    'market_saturation', 0,
    'entry_barriers', 0,
    'growth_potential', 0,
    'competitive_intensity', 0,
    'technology_adoption', 0
  )),
  data_aggregation_metrics = COALESCE(data_aggregation_metrics, jsonb_build_object(
    'data_completeness', 0,
    'data_accuracy', 0,
    'data_freshness', 0,
    'source_reliability', 0,
    'coverage_score', 0
  )),
  channel_effectiveness_score = COALESCE(channel_effectiveness_score, 0),
  primary_channels = COALESCE(primary_channels, '[]'::jsonb),
  competitive_strengths = COALESCE(competitive_strengths, '[]'::jsonb),
  platform_presence = COALESCE(platform_presence, '{}'::jsonb),
  customer_sentiment = COALESCE(customer_sentiment, '[]'::jsonb);

