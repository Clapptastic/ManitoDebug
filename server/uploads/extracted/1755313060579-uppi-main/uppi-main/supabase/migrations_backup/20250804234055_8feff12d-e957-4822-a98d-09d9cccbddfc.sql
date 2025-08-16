-- Drop the table if it exists to recreate it properly
DROP TABLE IF EXISTS public.type_coverage_metrics CASCADE;

-- Create type_coverage_metrics table for storing type coverage analysis data
CREATE TABLE public.type_coverage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  percentage NUMERIC NOT NULL DEFAULT 0,
  typed_files INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  typed_lines INTEGER NOT NULL DEFAULT 0,
  total_lines INTEGER NOT NULL DEFAULT 0,
  directory_breakdown JSONB DEFAULT '{}',
  worst_files JSONB DEFAULT '[]',
  type_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for type coverage metrics access
CREATE POLICY "Super admins can view all type coverage metrics" 
ON public.type_coverage_metrics 
FOR SELECT 
USING (is_super_admin_user());

CREATE POLICY "Super admins can create type coverage metrics" 
ON public.type_coverage_metrics 
FOR INSERT 
WITH CHECK (is_super_admin_user());

CREATE POLICY "Super admins can update type coverage metrics" 
ON public.type_coverage_metrics 
FOR UPDATE 
USING (is_super_admin_user());

CREATE POLICY "Super admins can delete type coverage metrics" 
ON public.type_coverage_metrics 
FOR DELETE 
USING (is_super_admin_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_type_coverage_metrics_updated_at
BEFORE UPDATE ON public.type_coverage_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.type_coverage_metrics (
  percentage, 
  typed_files, 
  total_files, 
  typed_lines, 
  total_lines,
  directory_breakdown,
  worst_files,
  type_errors
) VALUES (
  95.2,
  143,
  150,
  1847,
  1940,
  '{"src/components": {"percentage": 98.5, "files": 45}, "src/services": {"percentage": 92.1, "files": 23}, "src/hooks": {"percentage": 89.3, "files": 12}}'::jsonb,
  '[{"file": "src/components/LegacyComponent.tsx", "coverage": 65.2, "issues": 8}, {"file": "src/utils/oldHelpers.ts", "coverage": 71.4, "issues": 5}]'::jsonb,
  '[{"file": "src/components/LegacyComponent.tsx", "line": 45, "message": "3 type errors, 5 any types used", "severity": "error"}, {"file": "src/utils/oldHelpers.ts", "line": 12, "message": "1 type error, 2 any types used", "severity": "warning"}]'::jsonb
);