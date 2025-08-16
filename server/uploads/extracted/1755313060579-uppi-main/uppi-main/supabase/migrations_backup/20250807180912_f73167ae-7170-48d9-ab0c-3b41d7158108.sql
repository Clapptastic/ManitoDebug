-- Create business intelligence and reporting tables for Phase 12

-- Create custom_reports table (if not exists)
CREATE TABLE IF NOT EXISTS public.custom_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    query_config JSONB NOT NULL,
    chart_config JSONB DEFAULT '{}',
    schedule_config JSONB DEFAULT '{}',
    is_shared BOOLEAN DEFAULT false,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_schedules table (if not exists)
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    recipients TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_jobs table
CREATE TABLE IF NOT EXISTS public.export_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    request JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create business_insights table
CREATE TABLE IF NOT EXISTS public.business_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('trend', 'anomaly', 'recommendation', 'alert')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    data_source TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    impact_level TEXT NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    action_items TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_reports
DROP POLICY IF EXISTS "Users can manage their own reports" ON public.custom_reports;
CREATE POLICY "Users can manage their own reports" ON public.custom_reports
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shared reports" ON public.custom_reports;
CREATE POLICY "Users can view shared reports" ON public.custom_reports
    FOR SELECT USING (is_shared = true OR auth.uid() = user_id);

-- RLS Policies for report_schedules  
DROP POLICY IF EXISTS "Users can manage their report schedules" ON public.report_schedules;
CREATE POLICY "Users can manage their report schedules" ON public.report_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.custom_reports 
            WHERE id = report_id AND user_id = auth.uid()
        )
    );

-- RLS Policies for export_jobs
DROP POLICY IF EXISTS "Users can manage their own export jobs" ON public.export_jobs;
CREATE POLICY "Users can manage their own export jobs" ON public.export_jobs
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for business_insights
DROP POLICY IF EXISTS "Users can view their business insights" ON public.business_insights;
CREATE POLICY "Users can view their business insights" ON public.business_insights
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage insights" ON public.business_insights;
CREATE POLICY "Service role can manage insights" ON public.business_insights
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON public.custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_shared ON public.custom_reports(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_report_id ON public.report_schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON public.export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_business_insights_user_id ON public.business_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_business_insights_type ON public.business_insights(type);

-- Add trigger for updated_at columns
DROP TRIGGER IF EXISTS update_custom_reports_updated_at ON public.custom_reports;
CREATE TRIGGER update_custom_reports_updated_at
    BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();