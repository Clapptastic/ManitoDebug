-- Create missing tables for admin functionality

-- Edge function metrics table
CREATE TABLE public.edge_function_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT,
  memory_usage_mb NUMERIC,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table (as referenced in DATABASE_DESIGN.md)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Model versions table for API key management
CREATE TABLE public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  provider TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  pricing JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(model_name, version, provider)
);

-- Enable RLS
ALTER TABLE public.edge_function_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for edge_function_metrics
CREATE POLICY "Users can view their own function metrics" 
ON public.edge_function_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert function metrics" 
ON public.edge_function_metrics 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for documents
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
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for model_versions
CREATE POLICY "Anyone can view model versions" 
ON public.model_versions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage model versions" 
ON public.model_versions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'super_admin')
));

-- Updated at triggers
CREATE TRIGGER update_edge_function_metrics_updated_at
BEFORE UPDATE ON public.edge_function_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_versions_updated_at
BEFORE UPDATE ON public.model_versions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_edge_function_metrics_user_id ON public.edge_function_metrics(user_id);
CREATE INDEX idx_edge_function_metrics_function_name ON public.edge_function_metrics(function_name);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_file_type ON public.documents(file_type);
CREATE INDEX idx_model_versions_provider ON public.model_versions(provider);
CREATE INDEX idx_model_versions_active ON public.model_versions(is_active);