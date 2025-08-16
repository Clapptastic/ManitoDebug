-- Fix critical database permission issues for analysis flow
-- Only add policies that don't already exist

-- Check and add service role policies for analysis_provider_runs if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'analysis_provider_runs' 
        AND policyname = 'Service role can manage analysis_provider_runs'
    ) THEN
        CREATE POLICY "Service role can manage analysis_provider_runs" 
        ON public.analysis_provider_runs 
        FOR ALL 
        TO service_role 
        USING (true);
    END IF;
END $$;

-- Check and add service role policies for analysis_provider_results if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'analysis_provider_results' 
        AND policyname = 'Service role can manage analysis_provider_results'
    ) THEN
        CREATE POLICY "Service role can manage analysis_provider_results" 
        ON public.analysis_provider_results 
        FOR ALL 
        TO service_role 
        USING (true);
    END IF;
END $$;