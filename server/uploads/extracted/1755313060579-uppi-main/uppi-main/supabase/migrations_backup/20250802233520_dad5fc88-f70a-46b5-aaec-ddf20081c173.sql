-- Create model_versions table for tracking AI model availability
CREATE TABLE public.model_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  current_version TEXT,
  latest_version TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model_name)
);

-- Enable RLS
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for model_versions
CREATE POLICY "Allow super admins to view all model versions" 
ON public.model_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Allow super admins to insert model versions" 
ON public.model_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Allow super admins to update model versions" 
ON public.model_versions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Allow super admins to delete model versions" 
ON public.model_versions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_model_versions_updated_at
BEFORE UPDATE ON public.model_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial model data
INSERT INTO public.model_versions (provider, model_name, current_version, latest_version, status) VALUES
('openai', 'gpt-4o-mini', '2024-07-18', '2024-07-18', 'current'),
('openai', 'gpt-4o', '2024-08-06', '2024-08-06', 'current'),
('anthropic', 'claude-3-5-sonnet-20241022', '20241022', '20241022', 'current'),
('anthropic', 'claude-3-opus-20240229', '20240229', '20240229', 'current'),
('anthropic', 'claude-3-haiku-20240307', '20240307', '20240307', 'current'),
('perplexity', 'llama-3.1-sonar-small-128k-online', '3.1', '3.1', 'current'),
('perplexity', 'llama-3.1-sonar-large-128k-online', '3.1', '3.1', 'deprecated'),
('google', 'gemini-pro', '1.0', '1.0', 'current'),
('google', 'gemini-pro-vision', '1.0', '1.0', 'current');