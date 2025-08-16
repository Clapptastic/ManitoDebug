-- Fix model_versions RLS policies to allow users to read
DROP POLICY IF EXISTS "Users can view model versions" ON model_versions;

-- Allow all authenticated users to view model versions
CREATE POLICY "Users can view model versions" 
ON model_versions FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Ensure edge functions can insert/update model versions
CREATE POLICY "Service role can manage model versions" 
ON model_versions FOR ALL 
USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text 
  OR current_setting('role'::text) = 'service_role'::text
);