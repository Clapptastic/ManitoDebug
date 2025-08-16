-- Fix the typo in the previous migration and add RLS policies

-- Add RLS policies (fix typo from previous migration)
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_usage_costs
CREATE POLICY "Users can view their own API costs" ON public.api_usage_costs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API costs" ON public.api_usage_costs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for competitor_analysis_progress
CREATE POLICY "Users can view their own analysis progress" ON public.competitor_analysis_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis progress" ON public.competitor_analysis_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis progress" ON public.competitor_analysis_progress
FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance metrics" ON public.performance_metrics
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for affiliate_programs
CREATE POLICY "Anyone can view affiliate programs" ON public.affiliate_programs
FOR SELECT USING (true);