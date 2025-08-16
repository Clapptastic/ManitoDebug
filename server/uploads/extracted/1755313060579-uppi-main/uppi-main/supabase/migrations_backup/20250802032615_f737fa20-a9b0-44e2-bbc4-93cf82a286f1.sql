-- Enhanced competitor analysis schema with comprehensive data collection and normalization

-- Add comprehensive columns for enhanced analysis data
ALTER TABLE competitor_analyses ADD COLUMN IF NOT EXISTS 
  api_responses jsonb DEFAULT '{}',
  normalized_scores jsonb DEFAULT '{}',
  source_citations jsonb DEFAULT '[]',
  confidence_scores jsonb DEFAULT '{}',
  data_completeness_score numeric DEFAULT 0,
  last_updated_sources timestamp with time zone DEFAULT now(),
  market_share_estimate numeric DEFAULT 0,
  revenue_estimate numeric DEFAULT 0,
  employee_count_verified boolean DEFAULT false,
  website_verified boolean DEFAULT false,
  social_media_presence jsonb DEFAULT '{}',
  competitive_advantages text[],
  competitive_disadvantages text[],
  market_trends text[],
  swot_analysis jsonb DEFAULT '{}',
  financial_metrics jsonb DEFAULT '{}',
  technology_analysis jsonb DEFAULT '{}',
  customer_segments text[],
  geographic_presence text[],
  partnerships text[],
  key_personnel jsonb DEFAULT '{}',
  product_portfolio jsonb DEFAULT '{}',
  innovation_score numeric DEFAULT 0,
  market_sentiment_score numeric DEFAULT 0,
  brand_strength_score numeric DEFAULT 0,
  operational_efficiency_score numeric DEFAULT 0,
  overall_threat_level text DEFAULT 'medium',
  last_news_update timestamp with time zone,
  patent_count integer DEFAULT 0,
  certification_standards text[],
  environmental_social_governance jsonb DEFAULT '{}';

-- Create index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_scores ON competitor_analyses USING gin(normalized_scores);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_citations ON competitor_analyses USING gin(source_citations);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_completeness ON competitor_analyses (data_completeness_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_updated ON competitor_analyses (last_updated_sources DESC);

-- Create function to calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(analysis_record competitor_analyses)
RETURNS numeric AS $$
DECLARE
  score numeric := 0;
  total_fields numeric := 25; -- Total number of key data fields we track
BEGIN
  -- Core company information (5 points each)
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

CREATE TRIGGER trigger_update_data_completeness
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW EXECUTE FUNCTION update_data_completeness_trigger();

-- Create materialized view for easy retrieval with scoring
CREATE MATERIALIZED VIEW IF NOT EXISTS competitor_analysis_summary AS
SELECT 
  ca.id,
  ca.name,
  ca.user_id,
  ca.status,
  ca.industry,
  ca.market_position,
  ca.data_completeness_score,
  ca.overall_threat_level,
  ca.innovation_score,
  ca.market_sentiment_score,
  ca.brand_strength_score,
  ca.operational_efficiency_score,
  (ca.innovation_score + ca.market_sentiment_score + ca.brand_strength_score + ca.operational_efficiency_score) / 4 as overall_competitive_score,
  array_length(ca.strengths, 1) as strength_count,
  array_length(ca.weaknesses, 1) as weakness_count,
  array_length(ca.opportunities, 1) as opportunity_count,
  array_length(ca.threats, 1) as threat_count,
  jsonb_array_length(ca.source_citations) as source_count,
  ca.created_at,
  ca.updated_at,
  ca.completed_at
FROM competitor_analyses ca
WHERE ca.status = 'completed';

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitor_summary_id ON competitor_analysis_summary (id);
CREATE INDEX IF NOT EXISTS idx_competitor_summary_user ON competitor_analysis_summary (user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_summary_score ON competitor_analysis_summary (overall_competitive_score DESC);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_competitor_analysis_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_analysis_summary;
END;
$$ LANGUAGE plpgsql;

-- Create function to normalize scores across different AI responses
CREATE OR REPLACE FUNCTION normalize_ai_scores(api_responses jsonb)
RETURNS jsonb AS $$
DECLARE
  normalized jsonb := '{}';
  provider text;
  response jsonb;
  strength_score numeric := 0;
  weakness_score numeric := 0;
  market_position_score numeric := 0;
  innovation_score numeric := 0;
  count_providers integer := 0;
BEGIN
  -- Iterate through each AI provider response
  FOR provider, response IN SELECT * FROM jsonb_each(api_responses)
  LOOP
    count_providers := count_providers + 1;
    
    -- Normalize strength assessment (based on number and quality of strengths)
    IF response ? 'strengths' AND jsonb_typeof(response->'strengths') = 'array' THEN
      strength_score := strength_score + LEAST(jsonb_array_length(response->'strengths') * 20, 100);
    END IF;
    
    -- Normalize weakness assessment (inverse scoring)
    IF response ? 'weaknesses' AND jsonb_typeof(response->'weaknesses') = 'array' THEN
      weakness_score := weakness_score + GREATEST(100 - (jsonb_array_length(response->'weaknesses') * 15), 0);
    END IF;
    
    -- Market position scoring
    IF response ? 'market_position' THEN
      CASE WHEN lower(response->>'market_position') LIKE '%leader%' THEN market_position_score := market_position_score + 90;
           WHEN lower(response->>'market_position') LIKE '%challenger%' THEN market_position_score := market_position_score + 70;
           WHEN lower(response->>'market_position') LIKE '%follower%' THEN market_position_score := market_position_score + 50;
           WHEN lower(response->>'market_position') LIKE '%niche%' THEN market_position_score := market_position_score + 60;
           ELSE market_position_score := market_position_score + 50;
      END CASE;
    END IF;
    
    -- Innovation scoring based on technology and recent developments
    IF response ? 'technology_stack' OR response ? 'recent_developments' THEN
      innovation_score := innovation_score + 70; -- Base innovation score for having tech/development info
    END IF;
  END LOOP;
  
  -- Calculate averages if we have provider data
  IF count_providers > 0 THEN
    normalized := jsonb_build_object(
      'strength_score', ROUND(strength_score / count_providers, 2),
      'stability_score', ROUND(weakness_score / count_providers, 2),
      'market_position_score', ROUND(market_position_score / count_providers, 2),
      'innovation_score', ROUND(innovation_score / count_providers, 2),
      'data_sources_count', count_providers,
      'last_normalized', now()
    );
  END IF;
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;