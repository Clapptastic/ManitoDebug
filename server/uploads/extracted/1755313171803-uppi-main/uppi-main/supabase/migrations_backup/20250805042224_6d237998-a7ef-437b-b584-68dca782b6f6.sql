-- Complete migration: Create all missing tables with proper structure

-- Create affiliate_programs table (was missing from first migration)
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL,
    affiliate_code TEXT NOT NULL,
    commission_rate DECIMAL(5,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view affiliate programs" ON public.affiliate_programs
FOR SELECT USING (true);

-- Now add policies for other tables (they should exist now)
CREATE POLICY "Users can view their own API costs" ON public.api_usage_costs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API costs" ON public.api_usage_costs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analysis progress" ON public.competitor_analysis_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis progress" ON public.competitor_analysis_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis progress" ON public.competitor_analysis_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance metrics" ON public.performance_metrics
FOR INSERT WITH CHECK (auth.uid() = user_id);