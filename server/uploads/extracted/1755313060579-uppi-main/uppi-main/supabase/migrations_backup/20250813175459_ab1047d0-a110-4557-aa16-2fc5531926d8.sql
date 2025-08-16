-- Fix RLS policies for analysis_combined table to allow user access
DROP POLICY IF EXISTS "combined_user_manage" ON analysis_combined;

CREATE POLICY "analysis_combined_user_access" 
ON analysis_combined 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
);

-- Ensure the table has proper RLS enabled
ALTER TABLE analysis_combined ENABLE ROW LEVEL SECURITY;

-- Fix similar issues for analysis_provider_results and analysis_provider_runs
DROP POLICY IF EXISTS "results_user_manage" ON analysis_provider_results;
DROP POLICY IF EXISTS "runs_user_manage" ON analysis_provider_runs;

CREATE POLICY "analysis_provider_results_user_access" 
ON analysis_provider_results 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
);

CREATE POLICY "analysis_provider_runs_user_access" 
ON analysis_provider_runs 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() OR 
  auth.role() = 'service_role' OR 
  is_admin_user(auth.uid())
);

-- Also ensure these tables have RLS enabled
ALTER TABLE analysis_provider_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_provider_runs ENABLE ROW LEVEL SECURITY;