-- Phase: DB schema updates for competitor analysis enhancements
-- Note: Uses existing tables where possible to avoid duplication (api_usage_costs, api_metrics)

-- 1) Enhance competitor_analyses with new tracking fields
ALTER TABLE public.competitor_analyses
  ADD COLUMN IF NOT EXISTS data_quality_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS news_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS financial_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS public_company_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_news_refresh TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_symbol VARCHAR(16),
  ADD COLUMN IF NOT EXISTS exchange VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_public_company BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_completeness_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_drill_down_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_api_cost NUMERIC(10,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}'::jsonb;

-- Helpful indexes for new columns
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_stock_symbol ON public.competitor_analyses(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_last_news_refresh ON public.competitor_analyses(last_news_refresh);

-- 2) News articles table (scoped by analysis)
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  relevance_score NUMERIC(5,2),
  sentiment_score NUMERIC(5,2),
  article_content TEXT,
  api_cost NUMERIC(10,6) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage news for their own analyses; service_role and admins have access
CREATE POLICY IF NOT EXISTS "Users manage news for their analyses"
  ON public.news_articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = news_articles.competitor_analysis_id
      AND (ca.user_id = auth.uid() OR public.is_admin_user(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = news_articles.competitor_analysis_id
      AND (ca.user_id = auth.uid() OR public.is_admin_user(auth.uid()))
    )
  );

CREATE POLICY IF NOT EXISTS "Service role full access - news_articles"
  ON public.news_articles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_news_articles_analysis ON public.news_articles(competitor_analysis_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_news_articles_updated_at ON public.news_articles;
CREATE TRIGGER trg_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) AI drill down sessions
CREATE TABLE IF NOT EXISTS public.ai_drill_down_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  specific_area TEXT,
  user_prompt TEXT NOT NULL,
  ai_response TEXT,
  response_quality_score NUMERIC(5,2),
  provider TEXT,
  model TEXT,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_drill_down_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions and any session tied to their analysis
CREATE POLICY IF NOT EXISTS "Users manage their drill down sessions"
  ON public.ai_drill_down_sessions
  FOR ALL
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = ai_drill_down_sessions.analysis_id AND ca.user_id = auth.uid()
    ) OR public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = ai_drill_down_sessions.analysis_id AND ca.user_id = auth.uid()
    ) OR public.is_admin_user(auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Service role full access - ai_drill_down_sessions"
  ON public.ai_drill_down_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_ai_drill_down_sessions_analysis ON public.ai_drill_down_sessions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_drill_down_sessions_user ON public.ai_drill_down_sessions(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_ai_drill_down_sessions_updated_at ON public.ai_drill_down_sessions;
CREATE TRIGGER trg_ai_drill_down_sessions_updated_at
  BEFORE UPDATE ON public.ai_drill_down_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Data quality metrics table
CREATE TABLE IF NOT EXISTS public.data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  quality_score NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  confidence_level TEXT,
  data_source TEXT,
  provenance JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage metrics for their analyses"
  ON public.data_quality_metrics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = data_quality_metrics.analysis_id
      AND (ca.user_id = auth.uid() OR public.is_admin_user(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitor_analyses ca
      WHERE ca.id = data_quality_metrics.analysis_id
      AND (ca.user_id = auth.uid() OR public.is_admin_user(auth.uid()))
    )
  );

CREATE POLICY IF NOT EXISTS "Service role full access - data_quality_metrics"
  ON public.data_quality_metrics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_analysis ON public.data_quality_metrics(analysis_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_data_quality_metrics_updated_at ON public.data_quality_metrics;
CREATE TRIGGER trg_data_quality_metrics_updated_at
  BEFORE UPDATE ON public.data_quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Extend api_usage_costs for per-analysis and operation tracking
ALTER TABLE public.api_usage_costs
  ADD COLUMN IF NOT EXISTS analysis_id UUID,
  ADD COLUMN IF NOT EXISTS operation_type TEXT;

-- Add FK constraint to competitor_analyses (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_usage_costs_analysis_id_fkey'
  ) THEN
    ALTER TABLE public.api_usage_costs
      ADD CONSTRAINT api_usage_costs_analysis_id_fkey
      FOREIGN KEY (analysis_id)
      REFERENCES public.competitor_analyses(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful indexes for cost lookups and rollups
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_analysis ON public.api_usage_costs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_date ON public.api_usage_costs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_operation ON public.api_usage_costs(operation_type);

-- 6) Security review helpers: ensure RLS already active on new tables (done above)
--    No changes to reserved schemas; all changes in public.
