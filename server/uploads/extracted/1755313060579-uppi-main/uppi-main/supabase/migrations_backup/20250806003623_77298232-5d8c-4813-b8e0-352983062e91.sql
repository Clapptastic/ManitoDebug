-- Create missing tables for market analysis functionality

-- Market Analysis Sessions Table
CREATE TABLE IF NOT EXISTS public.market_analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('company_analysis', 'market_segment', 'ticker_search')),
  query_text TEXT NOT NULL,
  ticker_symbol TEXT,
  company_name TEXT,
  market_segment TEXT,
  time_range TEXT DEFAULT '1m',
  analysis_result JSONB,
  sentiment_score NUMERIC,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Data Cache Table
CREATE TABLE IF NOT EXISTS public.market_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_symbol TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('stock_price', 'historical', 'technical_indicators')),
  time_range TEXT NOT NULL,
  cached_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Sentiment Scores Table
CREATE TABLE IF NOT EXISTS public.market_sentiment_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_symbol TEXT,
  company_name TEXT,
  market_segment TEXT,
  sentiment_score NUMERIC NOT NULL CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
  sentiment_label TEXT NOT NULL,
  factors JSONB,
  data_sources TEXT[] NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sentiment_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for market_analysis_sessions
CREATE POLICY "Users can view their own analysis sessions" 
ON public.market_analysis_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis sessions" 
ON public.market_analysis_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis sessions" 
ON public.market_analysis_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for market_data_cache (allow all authenticated users to read cache)
CREATE POLICY "Authenticated users can read market data cache" 
ON public.market_data_cache 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage market data cache" 
ON public.market_data_cache 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create policies for market_sentiment_scores (read-only for authenticated users)
CREATE POLICY "Authenticated users can read sentiment scores" 
ON public.market_sentiment_scores 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage sentiment scores" 
ON public.market_sentiment_scores 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_analysis_sessions_user_id ON public.market_analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_market_analysis_sessions_created_at ON public.market_analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_ticker_type ON public.market_data_cache(ticker_symbol, data_type);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_expires ON public.market_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_market_sentiment_ticker ON public.market_sentiment_scores(ticker_symbol);
CREATE INDEX IF NOT EXISTS idx_market_sentiment_calculated ON public.market_sentiment_scores(calculated_at DESC);

-- Add updated_at trigger for market_analysis_sessions
CREATE TRIGGER update_market_analysis_sessions_updated_at
BEFORE UPDATE ON public.market_analysis_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();