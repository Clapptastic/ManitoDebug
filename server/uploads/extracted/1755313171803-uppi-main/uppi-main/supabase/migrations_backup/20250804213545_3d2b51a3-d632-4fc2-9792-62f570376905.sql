-- Remove all existing policies and add a simple authenticated user policy for debugging
DROP POLICY IF EXISTS "Super admins can view all microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can insert microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can update microservices" ON microservices;
DROP POLICY IF EXISTS "Super admins can delete microservices" ON microservices;
DROP POLICY IF EXISTS "Debug: Allow akclapp user" ON microservices;

-- Create a simple policy that allows any authenticated user to test
CREATE POLICY "Allow authenticated users" 
ON microservices FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);