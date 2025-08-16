-- Create model availability tracking table
CREATE TABLE IF NOT EXISTS public.model_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider, model_id, user_id)
);

-- Create system alerts table for deprecation warnings
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.model_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for model_availability
CREATE POLICY "Users can manage their own model availability" 
ON public.model_availability FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Service role access for model availability" 
ON public.model_availability FOR ALL 
USING (auth.role() = 'service_role');

-- Create policies for system_alerts
CREATE POLICY "Users can view their own alerts" 
ON public.system_alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.system_alerts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role access for system alerts" 
ON public.system_alerts FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_availability_user_provider ON public.model_availability(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_model_availability_last_checked ON public.model_availability(last_checked);
CREATE INDEX IF NOT EXISTS idx_system_alerts_user_unread ON public.system_alerts(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_model_availability_updated_at
BEFORE UPDATE ON public.model_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at
BEFORE UPDATE ON public.system_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();