-- Create model_versions table for storing AI model information
CREATE TABLE public.model_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    current_version TEXT NOT NULL,
    latest_version TEXT,
    status TEXT NOT NULL CHECK (status IN ('current', 'outdated', 'deprecated', 'discontinued')),
    deprecation_date TIMESTAMP WITH TIME ZONE,
    replacement_model TEXT,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(provider, model_name)
);

-- Enable Row Level Security
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for model_versions table
-- Admin users can do everything
CREATE POLICY "Admins can manage model versions" 
ON public.model_versions 
FOR ALL 
USING (is_admin_user());

-- Authenticated users can read model versions
CREATE POLICY "Authenticated users can view model versions" 
ON public.model_versions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_model_versions_updated_at
    BEFORE UPDATE ON public.model_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_model_versions_provider ON public.model_versions(provider);
CREATE INDEX idx_model_versions_status ON public.model_versions(status);
CREATE INDEX idx_model_versions_last_checked ON public.model_versions(last_checked);