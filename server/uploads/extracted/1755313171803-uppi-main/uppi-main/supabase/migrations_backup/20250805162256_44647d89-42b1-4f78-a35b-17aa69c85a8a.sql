-- Create package_dependencies table for tracking project dependencies
CREATE TABLE IF NOT EXISTS public.package_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT,
  description TEXT,
  homepage TEXT,
  is_vulnerable BOOLEAN DEFAULT false,
  vulnerability_details JSONB DEFAULT '{}',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create microservices table for admin panel management
CREATE TABLE IF NOT EXISTS public.microservices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'inactive',
  health_status TEXT DEFAULT 'unknown',
  endpoint_url TEXT,
  description TEXT,
  port INTEGER,
  environment JSONB DEFAULT '{}',
  resource_limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_health_check TIMESTAMP WITH TIME ZONE
);

-- Add missing columns to api_usage_costs for performance tracking
ALTER TABLE public.api_usage_costs 
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.package_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;

-- RLS policies for package_dependencies (admin access only)
CREATE POLICY "Admins can manage package dependencies" ON public.package_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for microservices (admin access only)  
CREATE POLICY "Admins can manage microservices" ON public.microservices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_package_dependencies_updated_at
  BEFORE UPDATE ON public.package_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_microservices_updated_at
  BEFORE UPDATE ON public.microservices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();