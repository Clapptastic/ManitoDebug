-- Enable RLS on system_components
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Admins can manage system components" ON public.system_components;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage system components" 
ON public.system_components 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Add metadata column if it doesn't exist
ALTER TABLE public.system_components 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Insert some default system components using the correct enum values
INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time, metadata) 
SELECT 'Database', 'PostgreSQL Database', 'operational'::component_status, 99.9, 5, '{"connections": 10}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Database');

INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time, metadata) 
SELECT 'API Gateway', 'REST API Gateway', 'operational'::component_status, 99.8, 12, '{"requests_per_minute": 450}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'API Gateway');

INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time, metadata) 
SELECT 'Edge Functions', 'Serverless Functions', 'operational'::component_status, 99.5, 25, '{"active_functions": 8, "total_invocations": 1250}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Edge Functions');

INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time, metadata) 
SELECT 'Storage', 'File Storage System', 'operational'::component_status, 99.9, 8, '{"used_space": "2.3GB", "total_space": "100GB"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Storage');