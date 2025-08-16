-- Create system_components table for system health monitoring
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  last_check TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_components
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create policies for system_components
CREATE POLICY "Admin users can view system components" 
ON public.system_components 
FOR SELECT 
USING (
  auth.role() = 'service_role' OR 
  public.is_admin_user(auth.uid())
);

CREATE POLICY "Service role can manage system components" 
ON public.system_components 
FOR ALL 
USING (auth.role() = 'service_role');

-- Insert default system components
INSERT INTO public.system_components (name, description, status) VALUES
  ('database', 'PostgreSQL Database', 'operational'),
  ('auth', 'Authentication System', 'operational'),
  ('storage', 'File Storage', 'operational'),
  ('edge_functions', 'Edge Functions', 'operational'),
  ('api_keys', 'API Key Management', 'operational')
ON CONFLICT DO NOTHING;

-- Create api_usage_costs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.api_usage_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, date)
);

-- Enable RLS on api_usage_costs
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for api_usage_costs
CREATE POLICY "Users can view their own API usage costs" 
ON public.api_usage_costs 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid()) OR
  auth.role() = 'service_role'
);

CREATE POLICY "Service role can manage API usage costs" 
ON public.api_usage_costs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_system_components_updated_at
  BEFORE UPDATE ON public.system_components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix potential UUID validation issues
CREATE OR REPLACE FUNCTION public.safe_uuid_cast(input_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL OR LENGTH(trim(input_text)) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Check if it's already a valid UUID format
  IF input_text ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
    RETURN input_text::UUID;
  END IF;
  
  -- If not valid UUID, return NULL instead of throwing error
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;