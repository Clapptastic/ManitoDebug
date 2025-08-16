-- Temporarily add a policy to allow the specific user akclapp@gmail.com to access microservices
-- This will help us debug the issue
CREATE POLICY "Debug: Allow akclapp user" 
ON microservices FOR SELECT 
USING (auth.email() = 'akclapp@gmail.com');