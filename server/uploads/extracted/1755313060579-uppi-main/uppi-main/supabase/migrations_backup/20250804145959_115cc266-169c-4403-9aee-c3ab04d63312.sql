-- Create system_components table for admin dashboard system health monitoring
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  uptime DECIMAL(5,2) DEFAULT 99.9,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  disk_usage DECIMAL(5,2) DEFAULT 0,
  connections INTEGER DEFAULT 0,
  latency INTEGER DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  error_rate DECIMAL(5,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to view system components
CREATE POLICY "Admin users can view system components" 
ON public.system_components 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (
  SELECT user_metadata->>'role' 
  FROM auth.users 
  WHERE id = auth.uid()
) = 'admin');

-- Create policy for admin users to manage system components
CREATE POLICY "Admin users can manage system components" 
ON public.system_components 
FOR ALL 
USING (auth.uid() IS NOT NULL AND (
  SELECT user_metadata->>'role' 
  FROM auth.users 
  WHERE id = auth.uid()
) = 'admin');

-- Insert default system components
INSERT INTO public.system_components (name, status, uptime, cpu_usage, memory_usage, disk_usage, connections, latency, response_time, error_rate) VALUES
('Database', 'operational', 99.9, 0, 0, 34.5, 12, 15, 0, 0),
('API Server', 'operational', 99.8, 45.2, 67.8, 23.4, 0, 0, 145, 0.1),
('Storage', 'operational', 99.9, 0, 0, 45.2, 0, 0, 0, 0),
('Authentication', 'operational', 99.7, 0, 0, 0, 0, 12, 89, 0.05);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_components_updated_at
BEFORE UPDATE ON public.system_components
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();