-- Create analysis runs tracking table
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('competitor_analysis', 'trend_analysis', 'market_research')),
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  execution_time_ms INTEGER DEFAULT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis runs
CREATE POLICY "Users can view their own analysis runs" 
ON public.analysis_runs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis runs" 
ON public.analysis_runs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis runs" 
ON public.analysis_runs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_type_created 
ON public.analysis_runs (user_id, run_type, created_at DESC);

-- Create function to auto-cleanup old runs (keep only last 5 per user per type)
CREATE OR REPLACE FUNCTION public.cleanup_old_analysis_runs()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old runs, keeping only the 5 most recent per user per run_type
  DELETE FROM public.analysis_runs
  WHERE user_id = NEW.user_id 
    AND run_type = NEW.run_type
    AND id NOT IN (
      SELECT id
      FROM public.analysis_runs
      WHERE user_id = NEW.user_id 
        AND run_type = NEW.run_type
      ORDER BY created_at DESC
      LIMIT 5
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-cleanup after inserts
CREATE TRIGGER cleanup_analysis_runs_trigger
  AFTER INSERT ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_analysis_runs();

-- Create updated_at trigger
CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();