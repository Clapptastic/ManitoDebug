-- Create type_coverage_metrics table for real TypeScript analysis
CREATE TABLE IF NOT EXISTS public.type_coverage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  total_lines INTEGER NOT NULL DEFAULT 0,
  typed_lines INTEGER NOT NULL DEFAULT 0,
  type_coverage_percentage NUMERIC NOT NULL DEFAULT 0,
  any_types_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  last_analyzed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_components table for real system health monitoring
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'outage')),
  uptime_percentage NUMERIC NOT NULL DEFAULT 100,
  response_time INTEGER NOT NULL DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create policies for type_coverage_metrics (admin only)
CREATE POLICY "Admins can manage type coverage metrics" 
ON public.type_coverage_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create policies for system_components (admin only)
CREATE POLICY "Admins can manage system components" 
ON public.system_components 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create update triggers
CREATE TRIGGER update_type_coverage_metrics_updated_at
  BEFORE UPDATE ON public.type_coverage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_components_updated_at
  BEFORE UPDATE ON public.system_components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system components
INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time) VALUES
  ('API Gateway', 'Main API gateway for all requests', 'operational', 99.9, 85),
  ('Database', 'Primary PostgreSQL database', 'operational', 99.8, 12),
  ('Authentication Service', 'User authentication and authorization', 'operational', 99.9, 45),
  ('File Storage', 'Supabase storage for files and documents', 'degraded', 98.5, 230),
  ('Edge Functions', 'Serverless functions for backend logic', 'operational', 99.7, 120)
ON CONFLICT (name) DO NOTHING;