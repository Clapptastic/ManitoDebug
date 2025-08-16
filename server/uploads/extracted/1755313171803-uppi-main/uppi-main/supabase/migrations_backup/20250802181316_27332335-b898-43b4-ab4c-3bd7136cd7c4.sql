-- Create error logs table for comprehensive error monitoring
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL CHECK (error_type IN ('client', 'server', 'network', 'validation', 'api')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  action TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Create performance metrics table
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor analysis progress table for real-time tracking
CREATE TABLE public.competitor_analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  total_competitors INTEGER NOT NULL DEFAULT 0,
  completed_competitors INTEGER NOT NULL DEFAULT 0,
  current_competitor TEXT,
  status TEXT NOT NULL CHECK (status IN ('initializing', 'analyzing', 'completed', 'failed', 'cancelled')) DEFAULT 'initializing',
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Users can insert their own error logs" ON public.error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all error logs" ON public.error_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for performance_metrics
CREATE POLICY "Users can insert their own performance metrics" ON public.performance_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance metrics" ON public.performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for competitor_analysis_progress
CREATE POLICY "Users can manage their own analysis progress" ON public.competitor_analysis_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_error_logs_user_created ON public.error_logs(user_id, created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity, created_at DESC);
CREATE INDEX idx_error_logs_type ON public.error_logs(error_type, created_at DESC);
CREATE INDEX idx_performance_metrics_user_created ON public.performance_metrics(user_id, created_at DESC);
CREATE INDEX idx_competitor_progress_session ON public.competitor_analysis_progress(session_id);
CREATE INDEX idx_competitor_progress_user_status ON public.competitor_analysis_progress(user_id, status);

-- Create trigger for updating updated_at in competitor_analysis_progress
CREATE OR REPLACE FUNCTION update_competitor_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitor_progress_updated_at_trigger
  BEFORE UPDATE ON public.competitor_analysis_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_progress_updated_at();