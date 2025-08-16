-- Fix competitor_analyses table RLS policies and ensure proper indexing

-- First, ensure the table has the correct structure
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS analysis_id UUID DEFAULT gen_random_uuid();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON public.competitor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_session_id ON public.competitor_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_analysis_id ON public.competitor_analyses(analysis_id);

-- Drop and recreate policies to fix permission issues
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Service role full access to competitor_analyses" ON public.competitor_analyses;

-- Disable and re-enable RLS to reset
ALTER TABLE public.competitor_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies with better error handling
CREATE POLICY "authenticated_users_select_own_analyses" 
ON public.competitor_analyses 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_insert_own_analyses" 
ON public.competitor_analyses 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_update_own_analyses" 
ON public.competitor_analyses 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_delete_own_analyses" 
ON public.competitor_analyses 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- Service role policy for edge functions
CREATE POLICY "service_role_full_access_analyses" 
ON public.competitor_analyses 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Update existing records to have analysis_id if missing
UPDATE public.competitor_analyses 
SET analysis_id = gen_random_uuid() 
WHERE analysis_id IS NULL;