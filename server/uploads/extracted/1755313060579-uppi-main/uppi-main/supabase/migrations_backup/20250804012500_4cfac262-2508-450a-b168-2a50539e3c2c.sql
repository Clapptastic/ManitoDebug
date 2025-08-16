-- Create user model configurations table
CREATE TABLE IF NOT EXISTS public.user_model_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, model_name)
);

-- Create user chatbot configurations table
CREATE TABLE IF NOT EXISTS public.user_chatbot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  assigned_provider TEXT NOT NULL,
  assigned_model TEXT NOT NULL,
  fallback_providers TEXT[] NOT NULL DEFAULT '{}',
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_model_configs
CREATE POLICY "Users can manage their own model configs" 
ON public.user_model_configs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_chatbot_configs
CREATE POLICY "Users can manage their own chatbot config" 
ON public.user_chatbot_configs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_model_configs_updated_at
  BEFORE UPDATE ON public.user_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_chatbot_configs_updated_at
  BEFORE UPDATE ON public.user_chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();