-- Create chat_settings table to store user AI preferences
CREATE TABLE public.chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  ai_model TEXT NOT NULL DEFAULT 'gpt-4.1-2025-04-14',
  temperature NUMERIC NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 1000,
  system_prompt TEXT DEFAULT 'You are a helpful AI business advisor with access to the user''s business data.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chat_settings_user_id_unique UNIQUE (user_id)
);

-- Enable RLS on chat_settings
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_settings
CREATE POLICY "Users can view their own chat settings" 
ON public.chat_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat settings" 
ON public.chat_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat settings" 
ON public.chat_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat settings" 
ON public.chat_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role access for all operations
CREATE POLICY "Service role full access to chat_settings" 
ON public.chat_settings 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_settings_updated_at
BEFORE UPDATE ON public.chat_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();