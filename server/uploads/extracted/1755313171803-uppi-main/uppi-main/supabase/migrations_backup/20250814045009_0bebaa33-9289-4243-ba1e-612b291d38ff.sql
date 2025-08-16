-- Create api_usage_costs table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.api_usage_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own API usage costs" ON public.api_usage_costs;
DROP POLICY IF EXISTS "Service role can manage API usage costs" ON public.api_usage_costs;
DROP POLICY IF EXISTS "api_usage_costs_admin_access" ON public.api_usage_costs;
DROP POLICY IF EXISTS "api_usage_costs_user_access" ON public.api_usage_costs;
DROP POLICY IF EXISTS "api_usage_costs_service_select" ON public.api_usage_costs;
DROP POLICY IF EXISTS "api_usage_costs_service_insert" ON public.api_usage_costs;
DROP POLICY IF EXISTS "Service role can insert api usage costs" ON public.api_usage_costs;

-- Create comprehensive policies
CREATE POLICY "api_usage_costs_user_select" ON public.api_usage_costs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "api_usage_costs_service_role_all" ON public.api_usage_costs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "api_usage_costs_admin_all" ON public.api_usage_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_id ON public.api_usage_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_created_at ON public.api_usage_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_provider ON public.api_usage_costs(provider);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_api_usage_costs_updated_at ON public.api_usage_costs;
CREATE TRIGGER update_api_usage_costs_updated_at
    BEFORE UPDATE ON public.api_usage_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();