-- Create microservices table
CREATE TABLE public.microservices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_url TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  documentation_url TEXT,
  api_spec_url TEXT,
  readme_url TEXT,
  endpoints JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage microservices"
ON public.microservices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view microservices"
ON public.microservices
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create package dependencies table
CREATE TABLE public.package_dependencies_extended (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('major', 'minor', 'patch')),
  has_security_update BOOLEAN NOT NULL DEFAULT false,
  has_breaking_changes BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  vulnerability_count INTEGER DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_outdated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_dependencies_extended ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage extended package dependencies"
ON public.package_dependencies_extended
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view extended package dependencies"
ON public.package_dependencies_extended
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create update jobs table  
CREATE TABLE public.update_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  logs JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.update_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage update jobs"
ON public.update_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create database optimization stats table
CREATE TABLE public.database_optimization_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_analyses INTEGER NOT NULL DEFAULT 0,
  avg_query_time_ms NUMERIC NOT NULL DEFAULT 0,
  index_efficiency_percent NUMERIC NOT NULL DEFAULT 100,
  storage_used_percent NUMERIC NOT NULL DEFAULT 0,
  cache_hit_rate_percent NUMERIC NOT NULL DEFAULT 100,
  slow_queries JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  optimization_history JSONB DEFAULT '[]'::jsonb,
  last_optimization TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.database_optimization_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage database optimization stats"
ON public.database_optimization_stats
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_microservices_updated_at
  BEFORE UPDATE ON public.microservices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_dependencies_extended_updated_at
  BEFORE UPDATE ON public.package_dependencies_extended
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_update_jobs_updated_at
  BEFORE UPDATE ON public.update_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_optimization_stats_updated_at
  BEFORE UPDATE ON public.database_optimization_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();