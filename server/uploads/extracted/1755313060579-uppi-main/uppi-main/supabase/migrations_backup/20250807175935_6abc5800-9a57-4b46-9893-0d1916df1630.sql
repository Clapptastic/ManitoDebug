-- Add missing columns to support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS resolution TEXT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE NULL;

-- Add missing columns to support_ticket_messages table  
ALTER TABLE public.support_ticket_messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create knowledge_base_articles table
CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NULL,
    tags TEXT[] DEFAULT '{}',
    slug TEXT NOT NULL UNIQUE,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    search_keywords TEXT[] DEFAULT '{}',
    meta_description TEXT NULL,
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    published_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_base_feedback table
CREATE TABLE IF NOT EXISTS public.knowledge_base_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.knowledge_base_articles(id) ON DELETE CASCADE,
    user_id UUID NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
    feedback_text TEXT NULL,
    user_ip INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_team_members table
CREATE TABLE IF NOT EXISTS public.support_team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('agent', 'supervisor', 'manager', 'admin')),
    department TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_concurrent_tickets INTEGER DEFAULT 10,
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"en"}',
    timezone TEXT DEFAULT 'UTC',
    working_hours JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_metrics table
CREATE TABLE IF NOT EXISTS public.support_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_tickets INTEGER DEFAULT 0,
    open_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    avg_resolution_time INTERVAL NULL,
    first_response_time INTERVAL NULL,
    customer_satisfaction_score DECIMAL(3,2) NULL,
    ticket_volume_by_category JSONB DEFAULT '{}',
    agent_performance JSONB DEFAULT '{}',
    knowledge_base_views INTEGER DEFAULT 0,
    knowledge_base_helpfulness DECIMAL(3,2) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_base_articles
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.knowledge_base_articles;
CREATE POLICY "Anyone can view published articles" ON public.knowledge_base_articles
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Support team can manage articles" ON public.knowledge_base_articles;
CREATE POLICY "Support team can manage articles" ON public.knowledge_base_articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.support_team_members 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR
        get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
        auth.role() = 'service_role'
    );

-- RLS Policies for knowledge_base_feedback
DROP POLICY IF EXISTS "Users can submit feedback" ON public.knowledge_base_feedback;
CREATE POLICY "Users can submit feedback" ON public.knowledge_base_feedback
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Support team can view feedback" ON public.knowledge_base_feedback;
CREATE POLICY "Support team can view feedback" ON public.knowledge_base_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_team_members 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR
        get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
        auth.role() = 'service_role'
    );

-- RLS Policies for support_team_members
DROP POLICY IF EXISTS "Support team can view team members" ON public.support_team_members;
CREATE POLICY "Support team can view team members" ON public.support_team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_team_members stm
            WHERE stm.user_id = auth.uid() AND stm.is_active = true
        ) OR
        get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Admins can manage team members" ON public.support_team_members;
CREATE POLICY "Admins can manage team members" ON public.support_team_members
    FOR ALL USING (
        get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
        auth.role() = 'service_role'
    );

-- RLS Policies for support_metrics
DROP POLICY IF EXISTS "Support team can view metrics" ON public.support_metrics;
CREATE POLICY "Support team can view metrics" ON public.support_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_team_members 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR
        get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Service role can manage metrics" ON public.support_metrics;
CREATE POLICY "Service role can manage metrics" ON public.support_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_category ON public.knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_published ON public.knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_feedback_article_id ON public.knowledge_base_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_support_team_members_user_id ON public.support_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_support_team_members_active ON public.support_team_members(is_active);

-- Create functions for knowledge base article helpfulness
CREATE OR REPLACE FUNCTION public.increment_helpful_count(article_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.knowledge_base_articles 
    SET helpful_count = helpful_count + 1, updated_at = now()
    WHERE id = article_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_not_helpful_count(article_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.knowledge_base_articles 
    SET not_helpful_count = not_helpful_count + 1, updated_at = now()
    WHERE id = article_id_param;
END;
$$;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_knowledge_base_articles_updated_at ON public.knowledge_base_articles;
CREATE TRIGGER update_knowledge_base_articles_updated_at
    BEFORE UPDATE ON public.knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_team_members_updated_at ON public.support_team_members;
CREATE TRIGGER update_support_team_members_updated_at
    BEFORE UPDATE ON public.support_team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();