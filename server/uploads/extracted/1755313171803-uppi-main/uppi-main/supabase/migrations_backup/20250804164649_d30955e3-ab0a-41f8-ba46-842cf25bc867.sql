-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage system components" ON public.system_components;
DROP POLICY IF EXISTS "Admins can view all system components" ON public.system_components;
DROP POLICY IF EXISTS "Admins can insert system components" ON public.system_components;
DROP POLICY IF EXISTS "Admins can update system components" ON public.system_components;

-- Create system_components table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  uptime_percentage NUMERIC DEFAULT 99.9,
  response_time INTEGER DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create policies for system_components
CREATE POLICY "Admins can view all system components" ON public.system_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert system components" ON public.system_components
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update system components" ON public.system_components
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role can access everything
CREATE POLICY "Service role can manage system components" ON public.system_components
  FOR ALL USING (
    (auth.jwt() ->> 'role')::text = 'service_role' OR 
    current_setting('role') = 'service_role'
  );

-- Insert some default system components
INSERT INTO public.system_components (name, status, uptime_percentage, response_time, description) VALUES
  ('API Gateway', 'operational', 99.9, 85, 'Main API gateway handling all requests'),
  ('Database', 'operational', 99.8, 12, 'Primary PostgreSQL database'),
  ('Authentication Service', 'operational', 99.9, 45, 'User authentication and authorization'),
  ('File Storage', 'operational', 98.5, 120, 'Document and file storage system')
ON CONFLICT DO NOTHING;