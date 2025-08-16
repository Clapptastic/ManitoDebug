-- Create API cost tracking table
CREATE TABLE public.api_usage_costs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    api_provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    model_used TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API costs" 
ON public.api_usage_costs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API costs" 
ON public.api_usage_costs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all API costs" 
ON public.api_usage_costs 
FOR SELECT 
USING (has_platform_role(auth.uid(), 'super_admin'));

-- Create indexes for performance
CREATE INDEX idx_api_usage_costs_user_id ON public.api_usage_costs(user_id);
CREATE INDEX idx_api_usage_costs_provider ON public.api_usage_costs(api_provider);
CREATE INDEX idx_api_usage_costs_timestamp ON public.api_usage_costs(request_timestamp);
CREATE INDEX idx_api_usage_costs_user_date ON public.api_usage_costs(user_id, request_timestamp);

-- Create aggregate view for cost analysis
CREATE OR REPLACE VIEW public.api_cost_summary AS
SELECT 
    user_id,
    api_provider,
    DATE(request_timestamp) as usage_date,
    COUNT(*) as total_requests,
    SUM(total_tokens) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(response_time_ms) as avg_response_time_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests
FROM public.api_usage_costs
GROUP BY user_id, api_provider, DATE(request_timestamp);

-- Create monthly cost summary for admin dashboard
CREATE OR REPLACE VIEW public.monthly_api_costs AS
SELECT 
    DATE_TRUNC('month', request_timestamp) as month,
    api_provider,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_requests,
    SUM(total_tokens) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_per_request
FROM public.api_usage_costs
WHERE success = true
GROUP BY DATE_TRUNC('month', request_timestamp), api_provider
ORDER BY month DESC, api_provider;