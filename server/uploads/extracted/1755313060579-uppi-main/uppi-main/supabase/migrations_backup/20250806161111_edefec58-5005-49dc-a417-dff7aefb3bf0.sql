-- Fix remaining RLS policy issues for documents table
DROP POLICY IF EXISTS "Service role can access documents" ON public.documents;
DROP POLICY IF EXISTS "Super admin and users can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Super admins have full access to documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
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

-- Service role access for all operations
CREATE POLICY "Service role full access to documents" 
ON public.documents 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix any remaining issues with competitor_analyses policies
DROP POLICY IF EXISTS "Service role can access competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Service role full access to competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Super admin and service role can manage analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Super admins have full access to competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;

-- Enable RLS on competitor_analyses table  
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for competitor_analyses
CREATE POLICY "Users can view their own competitor analyses" 
ON public.competitor_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor analyses" 
ON public.competitor_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analyses" 
ON public.competitor_analyses 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analyses" 
ON public.competitor_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role access for all operations
CREATE POLICY "Service role full access to competitor_analyses" 
ON public.competitor_analyses 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');