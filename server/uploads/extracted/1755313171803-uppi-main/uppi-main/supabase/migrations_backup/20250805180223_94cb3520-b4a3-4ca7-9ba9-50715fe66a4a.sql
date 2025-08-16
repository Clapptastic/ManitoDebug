-- Phase 1: Create missing core database tables with proper RLS

-- 1. Chat Sessions Table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  context JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'active'::TEXT CHECK (status IN ('active', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their sessions" 
ON public.chat_messages FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = chat_messages.session_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their sessions" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their sessions" 
ON public.chat_messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- 3. Market Research Table
CREATE TABLE public.market_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  research_type TEXT NOT NULL CHECK (research_type IN ('competitor_analysis', 'market_size', 'trend_analysis', 'customer_survey')),
  title TEXT NOT NULL,
  description TEXT,
  research_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'pending'::TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  data_sources JSONB DEFAULT '[]'::JSONB,
  confidence_score NUMERIC DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_research
CREATE POLICY "Users can manage their own market research" 
ON public.market_research FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Business Plans Table
CREATE TABLE public.business_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  industry TEXT,
  business_model TEXT,
  plan_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  financial_projections JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'draft'::TEXT CHECK (status IN ('draft', 'completed', 'shared', 'archived')),
  version INTEGER DEFAULT 1,
  template_used TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_plans
CREATE POLICY "Users can manage their own business plans" 
ON public.business_plans FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. MVP Projects Table
CREATE TABLE public.mvp_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('web_app', 'mobile_app', 'api', 'landing_page', 'other')),
  tech_stack JSONB DEFAULT '[]'::JSONB,
  features JSONB DEFAULT '[]'::JSONB,
  timeline JSONB DEFAULT '{}'::JSONB,
  budget_estimate NUMERIC,
  status TEXT DEFAULT 'planning'::TEXT CHECK (status IN ('planning', 'development', 'testing', 'deployed', 'paused')),
  repository_url TEXT,
  deployment_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mvp_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mvp_projects
CREATE POLICY "Users can manage their own MVP projects" 
ON public.mvp_projects FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Feedback Collection Table
CREATE TABLE public.feedback_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.mvp_projects(id) ON DELETE CASCADE,
  feedback_type TEXT CHECK (feedback_type IN ('user_feedback', 'survey', 'interview', 'usability_test', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  feedback_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_info JSONB DEFAULT '{}'::JSONB,
  priority TEXT DEFAULT 'medium'::TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new'::TEXT CHECK (status IN ('new', 'reviewed', 'implemented', 'rejected')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_collection ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_collection
CREATE POLICY "Users can manage their own feedback" 
ON public.feedback_collection FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Automation Workflows Table
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'manual', 'webhook')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  conditions JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'::TEXT CHECK (status IN ('active', 'paused', 'disabled', 'error')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_workflows
CREATE POLICY "Users can manage their own automation workflows" 
ON public.automation_workflows FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers for all tables
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_research_updated_at
  BEFORE UPDATE ON public.market_research
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_plans_updated_at
  BEFORE UPDATE ON public.business_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mvp_projects_updated_at
  BEFORE UPDATE ON public.mvp_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_collection_updated_at
  BEFORE UPDATE ON public.feedback_collection
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();