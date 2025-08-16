-- Create model_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.model_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  metadata JSONB DEFAULT '{}',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on model_versions table
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for model_versions table
CREATE POLICY "Anyone can view model versions" 
ON public.model_versions 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert model versions" 
ON public.model_versions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update model versions" 
ON public.model_versions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_model_versions_updated_at ON public.model_versions;
CREATE TRIGGER update_model_versions_updated_at
  BEFORE UPDATE ON public.model_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();