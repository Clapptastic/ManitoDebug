-- Phase 1: Market Analysis Database Schema Enhancement

-- Create stock_analysis table for ticker/company analysis
CREATE TABLE IF NOT EXISTS public.stock_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ticker_symbol TEXT NOT NULL,
  company_name TEXT,
  analysis_type TEXT NOT NULL DEFAULT 'comprehensive', -- comprehensive, quick, sentiment
  time_range TEXT NOT NULL DEFAULT '1m', -- 7d, 1m, 3m, 6m, ytd, 1y, custom
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  stock_data JSONB NOT NULL DEFAULT '{}', -- price, volume, market data
  financial_metrics JSONB DEFAULT '{}', -- pe ratio, market cap, etc
  sentiment_score NUMERIC DEFAULT 0, -- -1 to 1 sentiment
  ai_summary TEXT,
  ai_insights JSONB DEFAULT '[]', -- array of insights
  risk_factors JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  data_sources JSONB DEFAULT '[]', -- which APIs provided data
  confidence_score NUMERIC DEFAULT 0, -- 0-1 confidence in analysis
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_news table for news caching and sentiment
CREATE TABLE IF NOT EXISTS public.market_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_symbol TEXT,
  company_name TEXT,
  headline TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  url TEXT,
  source TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sentiment_score NUMERIC DEFAULT 0, -- -1 to 1 sentiment
  sentiment_label TEXT, -- positive, negative, neutral
  relevance_score NUMERIC DEFAULT 0, -- 0-1 relevance to query
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_queries table for natural language queries
CREATE TABLE IF NOT EXISTS public.market_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'natural_language', -- natural_language, ticker_search, industry_analysis
  ticker_symbols TEXT[] DEFAULT '{}',
  time_range TEXT DEFAULT '1m',
  ai_response TEXT,
  response_data JSONB DEFAULT '{}',
  related_analyses UUID[], -- array of stock_analysis ids
  confidence_score NUMERIC DEFAULT 0,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trend_analysis table for market trends
CREATE TABLE IF NOT EXISTS public.trend_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  analysis_scope TEXT NOT NULL, -- stock, sector, market, industry
  scope_identifier TEXT NOT NULL, -- ticker symbol, sector name, etc
  time_range TEXT NOT NULL DEFAULT '1m',
  trend_direction TEXT, -- bullish, bearish, sideways
  trend_strength NUMERIC DEFAULT 0, -- 0-1 strength
  key_metrics JSONB DEFAULT '{}',
  price_data JSONB DEFAULT '{}',
  volume_data JSONB DEFAULT '{}',
  indicators JSONB DEFAULT '{}', -- technical indicators
  ai_analysis TEXT,
  predictions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sentiment_analysis table for aggregated sentiment
CREATE TABLE IF NOT EXISTS public.sentiment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_symbol TEXT NOT NULL,
  time_period DATE NOT NULL,
  overall_sentiment NUMERIC DEFAULT 0, -- -1 to 1
  news_sentiment NUMERIC DEFAULT 0,
  social_sentiment NUMERIC DEFAULT 0,
  analyst_sentiment NUMERIC DEFAULT 0,
  sentiment_sources JSONB DEFAULT '{}',
  article_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all new tables
ALTER TABLE public.stock_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_analysis
CREATE POLICY "Users can manage their own stock analyses" 
ON public.stock_analysis FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access stock analyses" 
ON public.stock_analysis FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for market_news (public read, service write)
CREATE POLICY "Anyone can view market news" 
ON public.market_news FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage market news" 
ON public.market_news FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for market_queries
CREATE POLICY "Users can manage their own queries" 
ON public.market_queries FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access queries" 
ON public.market_queries FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for trend_analysis
CREATE POLICY "Users can manage their own trend analyses" 
ON public.trend_analysis FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access trend analyses" 
ON public.trend_analysis FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for sentiment_analysis (public read, service write)
CREATE POLICY "Anyone can view sentiment analysis" 
ON public.sentiment_analysis FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage sentiment analysis" 
ON public.sentiment_analysis FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_analysis_user_ticker ON public.stock_analysis(user_id, ticker_symbol);
CREATE INDEX IF NOT EXISTS idx_stock_analysis_status ON public.stock_analysis(status);
CREATE INDEX IF NOT EXISTS idx_market_news_ticker ON public.market_news(ticker_symbol);
CREATE INDEX IF NOT EXISTS idx_market_news_published ON public.market_news(published_at);
CREATE INDEX IF NOT EXISTS idx_market_queries_user ON public.market_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_scope ON public.trend_analysis(analysis_scope, scope_identifier);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_ticker_date ON public.sentiment_analysis(ticker_symbol, time_period);

-- Add triggers for updated_at
CREATE TRIGGER update_stock_analysis_updated_at
  BEFORE UPDATE ON public.stock_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_market_queries_updated_at
  BEFORE UPDATE ON public.market_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_trend_analysis_updated_at
  BEFORE UPDATE ON public.trend_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update existing market_research table for compatibility
ALTER TABLE public.market_research 
ADD COLUMN IF NOT EXISTS query_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS ticker_symbol TEXT,
ADD COLUMN IF NOT EXISTS time_range TEXT DEFAULT '1m',
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC DEFAULT 0;