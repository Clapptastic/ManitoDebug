-- Check if microservices table has proper RLS policies
-- First, let's check current policies
SELECT schemaname, tablename, policyname, cmd, permissive, qual 
FROM pg_policies 
WHERE tablename = 'microservices';

-- Enable RLS on microservices table
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage microservices" ON public.microservices;
DROP POLICY IF EXISTS "Authenticated users can view microservices" ON public.microservices;

-- Create proper RLS policies for microservices
CREATE POLICY "Admins can manage microservices" 
ON public.microservices 
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

-- Allow authenticated users to view microservices
CREATE POLICY "Authenticated users can view microservices" 
ON public.microservices 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert some sample microservices data if the table is empty
INSERT INTO public.microservices (name, display_name, description, base_url, version, status, is_active) 
SELECT 'competitor-analysis', 'Competitor Analysis Service', 'AI-powered competitor analysis microservice', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/competitor-analysis', '1.0.0', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.microservices WHERE name = 'competitor-analysis');

INSERT INTO public.microservices (name, display_name, description, base_url, version, status, is_active) 
SELECT 'api-validation', 'API Key Validation Service', 'Service for validating API keys and configurations', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/validate-api-key', '1.0.0', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.microservices WHERE name = 'api-validation');

INSERT INTO public.microservices (name, display_name, description, base_url, version, status, is_active) 
SELECT 'system-health', 'System Health Monitor', 'Service for monitoring system health and metrics', 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/system-health', '1.0.0', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.microservices WHERE name = 'system-health');