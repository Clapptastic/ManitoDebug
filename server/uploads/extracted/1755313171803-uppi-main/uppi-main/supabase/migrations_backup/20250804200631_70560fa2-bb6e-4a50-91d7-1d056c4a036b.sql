-- First, let's see what columns exist in system_components
-- and add missing ones if needed
DO $$
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_components' 
        AND column_name = 'metadata'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.system_components ADD COLUMN metadata jsonb DEFAULT '{}';
    END IF;
    
    -- Add other missing columns if needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_components' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.system_components ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_components' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.system_components ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Enable RLS
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

-- Insert some default system components if table is empty
INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Database', 'healthy', '{"response_time": "5ms", "connections": 10}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Database');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'API Gateway', 'healthy', '{"response_time": "12ms", "requests_per_minute": 450}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'API Gateway');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Edge Functions', 'healthy', '{"active_functions": 8, "total_invocations": 1250}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Edge Functions');

INSERT INTO public.system_components (name, status, metadata) 
SELECT 'Storage', 'healthy', '{"used_space": "2.3GB", "total_space": "100GB"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'Storage');