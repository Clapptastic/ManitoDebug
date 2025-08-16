-- Fix RLS policies for edge functions to access required tables

-- Add service role policies for master_company_profiles
CREATE POLICY "Service role can access master company profiles" 
ON public.master_company_profiles 
FOR ALL 
TO service_role 
USING (true);

-- Add service role policies for code_embeddings  
CREATE POLICY "Service role can access code embeddings"
ON public.code_embeddings
FOR ALL 
TO service_role
USING (true);

-- Add service role policies for embeddings_status
CREATE POLICY "Service role can access embeddings status"
ON public.embeddings_status  
FOR ALL
TO service_role
USING (true);

-- Also fix authenticator role access for better API access
CREATE POLICY "API access for master company profiles"
ON public.master_company_profiles
FOR SELECT
TO authenticator
USING (true);

CREATE POLICY "API access for code embeddings" 
ON public.code_embeddings
FOR SELECT
TO authenticator  
USING (true);

CREATE POLICY "API access for embeddings status"
ON public.embeddings_status
FOR SELECT
TO authenticator
USING (true);