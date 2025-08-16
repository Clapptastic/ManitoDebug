-- Add missing tables that are referenced in the codebase

-- Create api_usage_costs table for API cost tracking
CREATE TABLE IF NOT EXISTS public.api_usage_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider TEXT NOT NULL,
    service TEXT NOT NULL,
    cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor_analysis_progress table
CREATE TABLE IF NOT EXISTS public.competitor_analysis_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    total_competitors INTEGER NOT NULL DEFAULT 0,
    completed_competitors INTEGER NOT NULL DEFAULT 0,
    current_competitor TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_programs table
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL,
    affiliate_code TEXT NOT NULL,
    commission_rate DECIMAL(5,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create website_analytics table
CREATE TABLE IF NOT EXISTS public.website_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    pageviews INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    session_duration INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    traffic_sources JSONB DEFAULT '{}',
    device_types JSONB DEFAULT '{}',
    geographic_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_usage_costs
CREATE POLICY "Users can view their own API costs" ON public.api_usage_costs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API costs" ON public.api_usage_costs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for competitor_analysis_progress
CREATE POLICY "Users can view their own analysis progress" ON public.competitor_analysis_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis progress" ON public.competitor_analysis_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis progress" ON public.competitor_analysis_progress
FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance metrics" ON public.performance_metrics
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for affiliate_programs
CREATE POLICY "Anyone can view affiliate programs" ON public.affiliate_programs
FOR SELECT USING (true);

-- RLS policies for website_analytics
CREATE POLICY "Users can view their own website analytics" ON public.website_analytics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own website analytics" ON public.website_analytics
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own website analytics" ON public.website_analytics
FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_date ON public.api_usage_costs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_session ON public.competitor_analysis_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_metric ON public.performance_metrics(user_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_website_analytics_user_date ON public.website_analytics(user_id, date);

-- Add triggers for updated_at
CREATE TRIGGER update_api_usage_costs_updated_at
    BEFORE UPDATE ON public.api_usage_costs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_analysis_progress_updated_at
    BEFORE UPDATE ON public.competitor_analysis_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_programs_updated_at
    BEFORE UPDATE ON public.affiliate_programs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_analytics_updated_at
    BEFORE UPDATE ON public.website_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();