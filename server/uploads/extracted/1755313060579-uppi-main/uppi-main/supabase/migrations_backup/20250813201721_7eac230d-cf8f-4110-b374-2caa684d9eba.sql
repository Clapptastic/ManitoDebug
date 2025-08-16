-- Fix final database permission issues for analysis flow
-- Grant explicit permissions to service role for analysis tables

-- Fix analysis_provider_runs permissions
GRANT ALL ON analysis_provider_runs TO service_role;
GRANT ALL ON analysis_provider_results TO service_role;

-- Ensure RLS policies allow service role access
DO $$ 
BEGIN
    -- Drop existing restrictive policies if they exist
    DROP POLICY IF EXISTS "Service role can manage analysis_provider_runs" ON analysis_provider_runs;
    DROP POLICY IF EXISTS "Service role can manage analysis_provider_results" ON analysis_provider_results;
    
    -- Create comprehensive service role policies
    CREATE POLICY "Service role full access analysis_provider_runs" 
    ON analysis_provider_runs 
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);
    
    CREATE POLICY "Service role full access analysis_provider_results" 
    ON analysis_provider_results 
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);
END $$;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;