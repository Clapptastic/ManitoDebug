-- Add missing columns to competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS market_sentiment_score NUMERIC DEFAULT 0;

-- Add missing columns to master_company_profiles table
ALTER TABLE public.master_company_profiles 
ADD COLUMN IF NOT EXISTS normalized_name TEXT,
ADD COLUMN IF NOT EXISTS overall_confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_completeness_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS source_analyses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_validation_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create competitor_analysis_progress table
CREATE TABLE IF NOT EXISTS public.competitor_analysis_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  step TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create api_usage_costs table
CREATE TABLE IF NOT EXISTS public.api_usage_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_provider TEXT NOT NULL,
  endpoint TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create affiliate_links table (for the AffiliateAdmin component)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create website_analytics table
CREATE TABLE IF NOT EXISTS public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  website_url TEXT NOT NULL,
  analytics_data JSONB DEFAULT '{}'::jsonb,
  traffic_metrics JSONB DEFAULT '{}'::jsonb,
  performance_score NUMERIC DEFAULT 0,
  last_crawled TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.competitor_analysis_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for competitor_analysis_progress
CREATE POLICY "Users can view their own analysis progress" 
ON public.competitor_analysis_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis progress" 
ON public.competitor_analysis_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis progress" 
ON public.competitor_analysis_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for api_usage_costs
CREATE POLICY "Users can view their own API costs" 
ON public.api_usage_costs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert API costs" 
ON public.api_usage_costs 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for affiliate_links
CREATE POLICY "Users can view their own affiliate links" 
ON public.affiliate_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate links" 
ON public.affiliate_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate links" 
ON public.affiliate_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affiliate links" 
ON public.affiliate_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for website_analytics
CREATE POLICY "Users can view their own website analytics" 
ON public.website_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own website analytics" 
ON public.website_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own website analytics" 
ON public.website_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_user_id ON public.competitor_analysis_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_analysis_id ON public.competitor_analysis_progress(analysis_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_id ON public.api_usage_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_timestamp ON public.api_usage_costs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_public ON public.documents(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON public.affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_user_id ON public.website_analytics(user_id);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_competitor_analysis_progress_updated_at
    BEFORE UPDATE ON public.competitor_analysis_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
    BEFORE UPDATE ON public.affiliate_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_analytics_updated_at
    BEFORE UPDATE ON public.website_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();