-- Create competitor_analysis_progress table for tracking analysis status

CREATE TABLE IF NOT EXISTS public.competitor_analysis_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  current_competitor TEXT,
  completed_competitors INTEGER DEFAULT 0,
  total_competitors INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_user_id ON public.competitor_analysis_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_session_id ON public.competitor_analysis_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_progress_status ON public.competitor_analysis_progress(status);

-- Enable RLS on competitor_analysis_progress table
ALTER TABLE public.competitor_analysis_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for competitor_analysis_progress
CREATE POLICY "authenticated_users_select_own_progress" 
ON public.competitor_analysis_progress 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_insert_own_progress" 
ON public.competitor_analysis_progress 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "authenticated_users_update_own_progress" 
ON public.competitor_analysis_progress 
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

CREATE POLICY "authenticated_users_delete_own_progress" 
ON public.competitor_analysis_progress 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- Service role policy for edge functions
CREATE POLICY "service_role_full_access_progress" 
ON public.competitor_analysis_progress 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitor_analysis_progress_updated_at
  BEFORE UPDATE ON public.competitor_analysis_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_progress();