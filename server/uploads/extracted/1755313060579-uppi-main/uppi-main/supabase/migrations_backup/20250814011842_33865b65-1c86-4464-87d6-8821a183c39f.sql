-- Fix RLS policies for prompts table to allow authenticated users access
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.prompts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.prompts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.prompts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.prompts;

-- Create proper RLS policies for prompts table
CREATE POLICY "Authenticated users can read prompts" 
ON public.prompts 
FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can create prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update prompts" 
ON public.prompts 
FOR UPDATE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete prompts" 
ON public.prompts 
FOR DELETE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Fix RLS policies for prompt_versions table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.prompt_versions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.prompt_versions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.prompt_versions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.prompt_versions;

CREATE POLICY "Authenticated users can read prompt versions" 
ON public.prompt_versions 
FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can create prompt versions" 
ON public.prompt_versions 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update prompt versions" 
ON public.prompt_versions 
FOR UPDATE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete prompt versions" 
ON public.prompt_versions 
FOR DELETE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');