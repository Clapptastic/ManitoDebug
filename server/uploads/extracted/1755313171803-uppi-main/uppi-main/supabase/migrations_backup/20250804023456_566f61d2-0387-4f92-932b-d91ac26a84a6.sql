-- Fix RLS policies for contextAwareService

-- Enable RLS on documents table if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Fix documents policies (already exists but may have issues)
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can select their own documents" ON public.documents;  
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;

-- Create proper document policies
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix profiles table to handle .single() queries properly
-- The issue is multiple profiles for one user, let's ensure unique constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);

-- Enable RLS on user_chatbot_configs if not already enabled
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Create proper chatbot config policies
DROP POLICY IF EXISTS "Users can manage their own chatbot config" ON public.user_chatbot_configs;

CREATE POLICY "Users can view their own chatbot config" 
ON public.user_chatbot_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chatbot config" 
ON public.user_chatbot_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbot config" 
ON public.user_chatbot_configs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chatbot config" 
ON public.user_chatbot_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create chat history storage tables
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_history
CREATE POLICY "Users can view their own chat history" 
ON public.chat_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history" 
ON public.chat_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history" 
ON public.chat_history 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" 
ON public.chat_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_last_message ON public.chat_history(last_message_at DESC);

-- Create updated_at trigger for chat_history
CREATE OR REPLACE FUNCTION public.update_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_history_updated_at
  BEFORE UPDATE ON public.chat_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_history_updated_at();