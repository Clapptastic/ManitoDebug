-- Check existing RLS policies for microservices table
-- Enable RLS if not enabled
ALTER TABLE microservices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for microservices table
-- Allow super_admin to view all microservices
CREATE POLICY "Super admins can view all microservices" 
ON microservices FOR SELECT 
USING (is_super_admin());

-- Allow super_admin to insert microservices
CREATE POLICY "Super admins can insert microservices" 
ON microservices FOR INSERT 
WITH CHECK (is_super_admin());

-- Allow super_admin to update microservices
CREATE POLICY "Super admins can update microservices" 
ON microservices FOR UPDATE 
USING (is_super_admin());

-- Allow super_admin to delete microservices
CREATE POLICY "Super admins can delete microservices" 
ON microservices FOR DELETE 
USING (is_super_admin());