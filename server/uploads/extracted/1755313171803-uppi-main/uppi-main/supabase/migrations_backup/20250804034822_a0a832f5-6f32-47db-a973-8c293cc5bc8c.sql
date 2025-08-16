-- Create system_metrics table for real system monitoring data
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  disk_usage DECIMAL(5,2) DEFAULT 0,
  network_latency DECIMAL(8,2) DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  uptime DECIMAL(5,2) DEFAULT 99.9,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  overall_status TEXT DEFAULT 'operational' CHECK (overall_status IN ('operational', 'degraded', 'outage', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create package_dependencies table for real package management
CREATE TABLE public.package_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,
  is_vulnerable BOOLEAN DEFAULT false,
  description TEXT,
  homepage TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create type coverage tables for real TypeScript analysis
CREATE TABLE public.type_coverage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  percentage DECIMAL(5,2) DEFAULT 0,
  typed_lines INTEGER DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  typed_files INTEGER DEFAULT 0,
  total_files INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.type_coverage_directories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  directory_name TEXT NOT NULL,
  typed_files INTEGER DEFAULT 0,
  total_files INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  metrics_id UUID REFERENCES public.type_coverage_metrics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.type_coverage_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  percentage DECIMAL(5,2) DEFAULT 0,
  issues TEXT[] DEFAULT '{}',
  metrics_id UUID REFERENCES public.type_coverage_metrics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.type_coverage_directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.type_coverage_files ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (only authenticated users can read)
CREATE POLICY "Admin users can view system metrics" 
ON public.system_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can insert system metrics" 
ON public.system_metrics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can view package dependencies" 
ON public.package_dependencies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can manage package dependencies" 
ON public.package_dependencies 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can view type coverage metrics" 
ON public.type_coverage_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can manage type coverage metrics" 
ON public.type_coverage_metrics 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can view type coverage directories" 
ON public.type_coverage_directories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can manage type coverage directories" 
ON public.type_coverage_directories 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can view type coverage files" 
ON public.type_coverage_files 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can manage type coverage files" 
ON public.type_coverage_files 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at DESC);
CREATE INDEX idx_package_dependencies_name ON public.package_dependencies(name);
CREATE INDEX idx_type_coverage_metrics_created_at ON public.type_coverage_metrics(created_at DESC);

-- Insert some sample data for demonstration
INSERT INTO public.system_metrics (cpu_usage, memory_usage, disk_usage, network_latency, active_connections, error_rate, uptime, overall_status) 
VALUES (45.2, 62.8, 38.1, 25.3, 1247, 0.1, 99.9, 'operational');

INSERT INTO public.package_dependencies (name, current_version, latest_version, is_vulnerable, description) 
VALUES 
  ('react', '18.3.1', '18.3.1', false, 'A JavaScript library for building user interfaces'),
  ('@radix-ui/react-dialog', '1.1.2', '1.1.4', false, 'An accessible dialog component'),
  ('tailwind-merge', '1.14.0', '2.2.1', false, 'Merge Tailwind CSS classes'),
  ('lodash', '4.17.19', '4.17.21', true, 'A utility library with security vulnerabilities in older versions');

INSERT INTO public.type_coverage_metrics (percentage, typed_lines, total_lines, typed_files, total_files) 
VALUES (85.2, 12847, 15082, 156, 183);

-- Insert sample directory breakdown
INSERT INTO public.type_coverage_directories (directory_name, typed_files, total_files, percentage, metrics_id) 
SELECT 
  unnest(ARRAY['src/components', 'src/services', 'src/hooks', 'src/pages']),
  unnest(ARRAY[89, 23, 18, 26]),
  unnest(ARRAY[102, 25, 20, 36]),
  unnest(ARRAY[87.3, 92.0, 90.0, 72.2]),
  id
FROM public.type_coverage_metrics 
WHERE id = (SELECT id FROM public.type_coverage_metrics ORDER BY created_at DESC LIMIT 1);