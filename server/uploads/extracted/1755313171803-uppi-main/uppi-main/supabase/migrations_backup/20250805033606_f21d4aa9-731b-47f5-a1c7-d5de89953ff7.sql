-- Create AI validation logs table
CREATE TABLE IF NOT EXISTS public.ai_validation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content_type VARCHAR NOT NULL,
  content_preview TEXT,
  validation_result JSONB NOT NULL DEFAULT '{}',
  ai_models_used TEXT[] DEFAULT '{}',
  sources_checked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_validation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own validation logs" 
ON public.ai_validation_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert validation logs" 
ON public.ai_validation_logs 
FOR INSERT 
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_ai_validation_logs_updated_at
  BEFORE UPDATE ON public.ai_validation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add AI validation fields to competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS ai_validation_result JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_confidence NUMERIC(5,2) DEFAULT 0.00;