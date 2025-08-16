-- Create admin_api_keys table for platform-wide API keys
CREATE TABLE public.admin_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,
  name text NOT NULL,
  api_key text NOT NULL,
  masked_key text,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  is_active boolean DEFAULT true,
  status text DEFAULT 'active',
  permissions jsonb DEFAULT '["read", "write"]'::jsonb,
  usage_limit_per_month integer DEFAULT NULL,
  current_month_usage integer DEFAULT 0,
  last_used_at timestamp with time zone,
  last_validated timestamp with time zone,
  expires_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_api_keys
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_api_keys
CREATE POLICY "Super admin can manage all admin API keys" 
ON public.admin_api_keys 
FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- Service role full access for admin API keys
CREATE POLICY "Service role full access on admin API keys" 
ON public.admin_api_keys 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_api_keys_updated_at
BEFORE UPDATE ON public.admin_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_admin_api_keys_provider ON public.admin_api_keys(provider);
CREATE INDEX idx_admin_api_keys_active ON public.admin_api_keys(is_active);
CREATE INDEX idx_admin_api_keys_created_by ON public.admin_api_keys(created_by);

-- Create admin_api_usage_tracking table for tracking platform usage
CREATE TABLE public.admin_api_usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_api_key_id uuid NOT NULL REFERENCES public.admin_api_keys(id) ON DELETE CASCADE,
  user_id uuid, -- Optional: track which user triggered the usage
  endpoint text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  success boolean DEFAULT true,
  error_details jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_api_usage_tracking
ALTER TABLE public.admin_api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_api_usage_tracking
CREATE POLICY "Super admin can manage all admin API usage" 
ON public.admin_api_usage_tracking 
FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- Service role full access for admin API usage tracking
CREATE POLICY "Service role full access on admin API usage tracking" 
ON public.admin_api_usage_tracking 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create indexes for admin_api_usage_tracking
CREATE INDEX idx_admin_api_usage_tracking_key_id ON public.admin_api_usage_tracking(admin_api_key_id);
CREATE INDEX idx_admin_api_usage_tracking_user_id ON public.admin_api_usage_tracking(user_id);
CREATE INDEX idx_admin_api_usage_tracking_created_at ON public.admin_api_usage_tracking(created_at);