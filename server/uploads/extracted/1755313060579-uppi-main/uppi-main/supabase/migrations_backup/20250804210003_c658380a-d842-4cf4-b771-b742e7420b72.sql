-- Fix RLS policies for documents and api_usage_costs tables

-- Documents table policies - ensure users can access their own documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Recreate documents policies with proper checks
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- API usage costs policies - ensure users can access their own costs
DROP POLICY IF EXISTS "Users can view their own API costs" ON public.api_usage_costs;
DROP POLICY IF EXISTS "Users can view their own API usage costs" ON public.api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API costs" ON public.api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API usage costs" ON public.api_usage_costs;

-- Recreate api_usage_costs policies with proper checks
CREATE POLICY "Users can view their own API usage costs" 
ON public.api_usage_costs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage costs" 
ON public.api_usage_costs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Clean up duplicate microservices policies - keep the simpler authenticated user policies
DROP POLICY IF EXISTS "Admins can manage microservices" ON public.microservices;
DROP POLICY IF EXISTS "Allow authenticated users to delete microservices" ON public.microservices;
DROP POLICY IF EXISTS "Allow authenticated users to insert microservices" ON public.microservices;
DROP POLICY IF EXISTS "Allow authenticated users to update microservices" ON public.microservices;
DROP POLICY IF EXISTS "Allow authenticated users to view microservices" ON public.microservices;
DROP POLICY IF EXISTS "Authenticated users can view microservices" ON public.microservices;

-- Recreate clean microservices policies for authenticated users
CREATE POLICY "Authenticated users can manage microservices" 
ON public.microservices 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);