-- Create performance indexes for api_metrics to optimize analytics queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_at ON public.api_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created_at ON public.api_metrics (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_created_at ON public.api_metrics (endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status_created_at ON public.api_metrics (status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_response_time ON public.api_metrics (response_time_ms);