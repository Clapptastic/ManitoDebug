-- Comprehensive audit and enhancement of market analysis system
-- Add missing trust and validation columns to existing tables

-- Enhance market_analysis_sessions with confidence scoring and source tracking
ALTER TABLE public.market_analysis_sessions 
ADD COLUMN IF NOT EXISTS confidence_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_citations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_models_used TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sources_checked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consistency_score NUMERIC DEFAULT 0.0;

-- Enhance market_news with trust indicators
ALTER TABLE public.market_news 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS source_reliability_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS fact_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bias_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS source_category TEXT DEFAULT 'unknown';

-- Enhance market_sentiment_scores with validation data
ALTER TABLE public.market_sentiment_scores 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS validation_method TEXT DEFAULT 'ai_analysis',
ADD COLUMN IF NOT EXISTS cross_validation_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS source_count INTEGER DEFAULT 1;

-- Create trusted_data_sources table for managing reliable data providers
CREATE TABLE IF NOT EXISTS public.trusted_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'news', 'financial', 'social', 'government', 'research')),
  reliability_score NUMERIC NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 100),
  api_endpoint TEXT,
  api_key_required BOOLEAN DEFAULT false,
  rate_limit_per_hour INTEGER DEFAULT 100,
  cost_per_request NUMERIC DEFAULT 0.0,
  data_freshness_hours INTEGER DEFAULT 24,
  supported_regions TEXT[] DEFAULT '{"global"}',
  is_active BOOLEAN DEFAULT true,
  last_validation TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validation_frequency_hours INTEGER DEFAULT 168, -- Weekly validation
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_data_validation table for tracking data accuracy
CREATE TABLE IF NOT EXISTS public.market_data_validation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL,
  data_identifier TEXT NOT NULL, -- ticker, company name, etc.
  validation_method TEXT NOT NULL,
  validation_score NUMERIC NOT NULL CHECK (validation_score >= 0 AND validation_score <= 100),
  cross_references TEXT[] DEFAULT '{}',
  discrepancies JSONB DEFAULT '{}',
  validated_by TEXT NOT NULL,
  validation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_model_performance table for tracking AI accuracy
CREATE TABLE IF NOT EXISTS public.ai_model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT,
  task_type TEXT NOT NULL,
  accuracy_score NUMERIC NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  confidence_calibration NUMERIC DEFAULT 0.0,
  bias_metrics JSONB DEFAULT '{}',
  validation_dataset_size INTEGER DEFAULT 0,
  last_evaluation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performance_trend TEXT DEFAULT 'stable',
  cost_per_request NUMERIC DEFAULT 0.0,
  avg_response_time_ms INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.trusted_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for trusted_data_sources (admin-only for modifications)
CREATE POLICY "Authenticated users can read trusted sources" 
ON public.trusted_data_sources 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage trusted sources" 
ON public.trusted_data_sources 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- Create policies for market_data_validation
CREATE POLICY "Users can read validation data" 
ON public.market_data_validation 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage validation data" 
ON public.market_data_validation 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create policies for ai_model_performance
CREATE POLICY "Users can read AI performance data" 
ON public.ai_model_performance 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage AI performance data" 
ON public.ai_model_performance 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trusted_sources_type ON public.trusted_data_sources(source_type, is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_sources_reliability ON public.trusted_data_sources(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_validation_data_type ON public.market_data_validation(data_type, data_identifier);
CREATE INDEX IF NOT EXISTS idx_validation_timestamp ON public.market_data_validation(validation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_model ON public.ai_model_performance(model_name, task_type);
CREATE INDEX IF NOT EXISTS idx_ai_performance_accuracy ON public.ai_model_performance(accuracy_score DESC);

-- Insert initial trusted data sources
INSERT INTO public.trusted_data_sources (source_name, source_type, reliability_score, api_endpoint, api_key_required, metadata) VALUES
('Yahoo Finance', 'financial', 85, 'https://query1.finance.yahoo.com/v8/finance/chart/', false, '{"free": true, "rate_limit": "2000/hour"}'),
('Alpha Vantage', 'financial', 92, 'https://www.alphavantage.co/query', true, '{"premium": true, "rate_limit": "5/minute"}'),
('Financial Modeling Prep', 'financial', 88, 'https://financialmodelingprep.com/api/v3/', true, '{"real_time": true}'),
('NewsAPI', 'news', 80, 'https://newsapi.org/v2/everything', true, '{"global_coverage": true}'),
('Polygon.io', 'financial', 95, 'https://api.polygon.io/v2/', true, '{"real_time": true, "premium": true}'),
('Quandl', 'financial', 90, 'https://www.quandl.com/api/v3/', true, '{"historical_data": true}'),
('SEC EDGAR', 'government', 98, 'https://data.sec.gov/api/xbrl/', false, '{"official": true, "filing_data": true}'),
('Federal Reserve Economic Data', 'government', 97, 'https://api.stlouisfed.org/fred/', true, '{"economic_indicators": true}')
ON CONFLICT (source_name) DO NOTHING;

-- Insert AI model performance baselines
INSERT INTO public.ai_model_performance (model_name, model_version, task_type, accuracy_score, confidence_calibration, metadata) VALUES
('gpt-4o-mini', '2024-07-18', 'market_analysis', 85, 0.82, '{"cost_effective": true, "fast": true}'),
('gpt-4o', '2024-05-13', 'market_analysis', 92, 0.88, '{"high_accuracy": true, "expensive": true}'),
('claude-3-sonnet', '20240229', 'sentiment_analysis', 87, 0.85, '{"good_reasoning": true}'),
('claude-3-opus', '20240229', 'comprehensive_analysis', 91, 0.89, '{"excellent_reasoning": true, "expensive": true}')
ON CONFLICT DO NOTHING;

-- Add trigger for updating trusted_data_sources timestamp
CREATE TRIGGER update_trusted_sources_updated_at
BEFORE UPDATE ON public.trusted_data_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updating ai_model_performance timestamp
CREATE TRIGGER update_ai_performance_updated_at
BEFORE UPDATE ON public.ai_model_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();