-- Phase 3: Business Intelligence Tables
-- Create analytics dashboards table
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dashboard_config JSONB NOT NULL DEFAULT '{}',
  widgets JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data visualizations table
CREATE TABLE IF NOT EXISTS public.data_visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.analytics_dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  data_source TEXT NOT NULL,
  chart_config JSONB NOT NULL DEFAULT '{}',
  position JSONB DEFAULT '{"x": 0, "y": 0, "w": 6, "h": 4}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled exports table
CREATE TABLE IF NOT EXISTS public.scheduled_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  export_type TEXT NOT NULL,
  schedule_cron TEXT NOT NULL,
  data_query JSONB NOT NULL DEFAULT '{}',
  export_config JSONB DEFAULT '{}',
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business metrics table
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  dimensions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

-- Analytics dashboards policies
CREATE POLICY "Users can manage their own dashboards" 
ON public.analytics_dashboards 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public dashboards" 
ON public.analytics_dashboards 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Data visualizations policies
CREATE POLICY "Users can manage visualizations in their dashboards" 
ON public.data_visualizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.analytics_dashboards 
    WHERE id = data_visualizations.dashboard_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view visualizations in accessible dashboards" 
ON public.data_visualizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.analytics_dashboards 
    WHERE id = data_visualizations.dashboard_id 
    AND (user_id = auth.uid() OR is_public = true)
  )
);

-- Scheduled exports policies
CREATE POLICY "Users can manage their own exports" 
ON public.scheduled_exports 
FOR ALL 
USING (auth.uid() = user_id);

-- Business metrics policies
CREATE POLICY "Admins can view all metrics" 
ON public.business_metrics 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can manage metrics" 
ON public.business_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add update triggers
CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON public.analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_visualizations_updated_at
  BEFORE UPDATE ON public.data_visualizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_exports_updated_at
  BEFORE UPDATE ON public.scheduled_exports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();