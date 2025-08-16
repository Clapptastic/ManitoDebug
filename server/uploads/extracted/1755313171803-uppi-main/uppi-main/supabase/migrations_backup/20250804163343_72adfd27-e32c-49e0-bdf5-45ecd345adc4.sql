-- Create microservices table
CREATE TABLE IF NOT EXISTS public.microservices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  base_url TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance')),
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  documentation_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;

-- Create policies for microservices access (admin only)
CREATE POLICY "Admin users can view microservices" 
ON public.microservices 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin users can create microservices" 
ON public.microservices 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin users can update microservices" 
ON public.microservices 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin users can delete microservices" 
ON public.microservices 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_microservices_updated_at
BEFORE UPDATE ON public.microservices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample microservices for testing
INSERT INTO public.microservices (name, display_name, description, base_url, version, status, health_check_url) VALUES
('competitor-analysis', 'Competitor Analysis Service', 'AI-powered competitor analysis and market research', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/competitor-analysis', '1.0.0', 'active', '/health'),
('code-wiki', 'Code Wiki System', 'Documentation and code management system', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/code-wiki', '1.0.0', 'active', '/health'),
('admin-api', 'Admin API Service', 'Administrative operations and analytics', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/admin-api', '1.0.0', 'active', '/health'),
('type-coverage', 'Type Coverage Analysis', 'TypeScript type coverage analysis and reporting', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/type-coverage-analysis', '1.0.0', 'active', '/health'),
('system-health', 'System Health Monitor', 'Real-time system health monitoring and alerts', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/system-health', '1.0.0', 'active', '/health')
ON CONFLICT (name) DO NOTHING;