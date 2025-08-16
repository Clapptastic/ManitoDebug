-- Enable RLS on microservices table
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for microservices table
-- Allow authenticated users to view all microservices
CREATE POLICY "Allow authenticated users to view microservices" 
ON public.microservices 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert microservices
CREATE POLICY "Allow authenticated users to insert microservices" 
ON public.microservices 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update microservices
CREATE POLICY "Allow authenticated users to update microservices" 
ON public.microservices 
FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users to delete microservices
CREATE POLICY "Allow authenticated users to delete microservices" 
ON public.microservices 
FOR DELETE 
TO authenticated 
USING (true);