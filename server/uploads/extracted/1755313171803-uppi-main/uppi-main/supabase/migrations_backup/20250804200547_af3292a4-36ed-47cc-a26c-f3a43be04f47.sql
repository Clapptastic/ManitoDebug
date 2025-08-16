-- Check if system_components table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.system_components (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'healthy',
  last_check timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

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

-- Insert some default system components if table is empty
INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Database', 'healthy', '{"response_time": "5ms", "connections": 10}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Database');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'API Gateway', 'healthy', '{"response_time": "12ms", "requests_per_minute": 450}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'API Gateway');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Edge Functions', 'healthy', '{"active_functions": 8, "total_invocations": 1250}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Edge Functions');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Storage', 'healthy', '{"used_space": "2.3GB", "total_space": "100GB"}'
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Storage');