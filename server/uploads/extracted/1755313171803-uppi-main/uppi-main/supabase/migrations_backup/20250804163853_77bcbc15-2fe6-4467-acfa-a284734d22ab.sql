-- Add actual_cost column to competitor_analyses table
ALTER TABLE public.competitor_analyses ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0;

-- Create api_metrics table for tracking API usage metrics
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status INTEGER NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  latency INTEGER NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on api_metrics
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for api_metrics
CREATE POLICY "Users can view their own API metrics" ON public.api_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API metrics" ON public.api_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all API metrics" ON public.api_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_id ON public.api_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_at ON public.api_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_provider ON public.api_metrics(provider);