-- Enhanced competitor analysis schema with comprehensive data collection and normalization

-- Add comprehensive columns for enhanced analysis data (one by one to avoid syntax issues)
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS api_responses jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS normalized_scores jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS source_citations jsonb DEFAULT '[]';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS confidence_scores jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS data_completeness_score numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS last_updated_sources timestamp with time zone DEFAULT now();
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS market_share_estimate numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS revenue_estimate numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS employee_count_verified boolean DEFAULT false;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS website_verified boolean DEFAULT false;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS social_media_presence jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS competitive_advantages text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS competitive_disadvantages text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS market_trends text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS swot_analysis jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS financial_metrics jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS technology_analysis jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS customer_segments text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS geographic_presence text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS partnerships text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS key_personnel jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS product_portfolio jsonb DEFAULT '{}';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS innovation_score numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS market_sentiment_score numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS brand_strength_score numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS operational_efficiency_score numeric DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS overall_threat_level text DEFAULT 'medium';
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS last_news_update timestamp with time zone;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS patent_count integer DEFAULT 0;
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS certification_standards text[];
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS environmental_social_governance jsonb DEFAULT '{}';

-- Create indexes for faster retrieval
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_scores ON competitor_analyses USING gin(normalized_scores);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_citations ON competitor_analyses USING gin(source_citations);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_completeness ON competitor_analyses (data_completeness_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_updated ON competitor_analyses (last_updated_sources DESC);

-- Create function to calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(analysis_record competitor_analyses)
RETURNS numeric AS $$
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
  IF analysis_record.pricing_strategy IS NOT NULL AND jsonb_object_keys(analysis_record.pricing_strategy) IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.funding_info IS NOT NULL AND jsonb_object_keys(analysis_record.funding_info) IS NOT NULL THEN score := score + 4; END IF;
  
  -- Enhanced data fields (4 points each)
  IF analysis_record.competitive_advantages IS NOT NULL AND array_length(analysis_record.competitive_advantages, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.customer_segments IS NOT NULL AND array_length(analysis_record.customer_segments, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.geographic_presence IS NOT NULL AND array_length(analysis_record.geographic_presence, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.product_portfolio IS NOT NULL AND jsonb_object_keys(analysis_record.product_portfolio) IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.technology_analysis IS NOT NULL AND jsonb_object_keys(analysis_record.technology_analysis) IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.financial_metrics IS NOT NULL AND jsonb_object_keys(analysis_record.financial_metrics) IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.key_personnel IS NOT NULL AND jsonb_object_keys(analysis_record.key_personnel) IS NOT NULL THEN score := score + 4; END IF;
  IF analysis_record.partnerships IS NOT NULL AND array_length(analysis_record.partnerships, 1) > 0 THEN score := score + 4; END IF;
  IF analysis_record.source_citations IS NOT NULL AND jsonb_array_length(analysis_record.source_citations) > 0 THEN score := score + 4; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically update data completeness score
CREATE OR REPLACE FUNCTION update_data_completeness_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_completeness_score := calculate_data_completeness_score(NEW);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_data_completeness ON competitor_analyses;
CREATE TRIGGER trigger_update_data_completeness
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW EXECUTE FUNCTION update_data_completeness_trigger();