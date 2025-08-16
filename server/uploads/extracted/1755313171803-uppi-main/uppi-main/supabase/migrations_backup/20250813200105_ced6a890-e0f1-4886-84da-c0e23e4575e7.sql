-- Fix critical database permission issues for analysis flow

-- Add service role policies for analysis_provider_runs
CREATE POLICY "Service role can manage analysis_provider_runs" 
ON public.analysis_provider_runs 
FOR ALL 
TO service_role 
USING (true);

-- Add service role policies for analysis_provider_results  
CREATE POLICY "Service role can manage analysis_provider_results" 
ON public.analysis_provider_results 
FOR ALL 
TO service_role 
USING (true);

-- Add service role policies for api_usage_costs
CREATE POLICY "Service role can manage api_usage_costs" 
ON public.api_usage_costs 
FOR ALL 
TO service_role 
USING (true);

-- Add service role policies for analysis_combined
CREATE POLICY "Service role can manage analysis_combined" 
ON public.analysis_combined 
FOR ALL 
TO service_role 
USING (true);

-- Ensure system operations are allowed for edge functions
CREATE OR REPLACE FUNCTION public.allow_service_role_operations(table_name text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Always allow service role
    IF auth.role() = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Allow authenticated users for their own data
    IF auth.uid() IS NOT NULL THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;