-- PHASE 1: Fix all foreign key constraints and database foundation issues
-- This addresses authentication and data persistence issues

-- 1. Remove all foreign key constraints to auth.users (causes RLS issues)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
ALTER TABLE public.documentation DROP CONSTRAINT IF EXISTS documentation_created_by_fkey;
ALTER TABLE public.query_metrics DROP CONSTRAINT IF EXISTS query_metrics_user_id_fkey;
ALTER TABLE public.edge_function_metrics DROP CONSTRAINT IF EXISTS edge_function_metrics_user_id_fkey;
ALTER TABLE public.code_embeddings DROP CONSTRAINT IF EXISTS code_embeddings_user_id_fkey;
ALTER TABLE public.embeddings_status DROP CONSTRAINT IF EXISTS embeddings_status_user_id_fkey;
ALTER TABLE public.competitor_groups DROP CONSTRAINT IF EXISTS competitor_groups_user_id_fkey;
ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_user_id_fkey;
ALTER TABLE public.performance_metrics DROP CONSTRAINT IF EXISTS performance_metrics_user_id_fkey;
ALTER TABLE public.competitor_analysis_progress DROP CONSTRAINT IF EXISTS competitor_analysis_progress_user_id_fkey;

-- 2. Create proper triggers for competitor_analyses table
-- Ensure data completeness is calculated on insert and update
DROP TRIGGER IF EXISTS update_competitor_analyses_updated_at ON public.competitor_analyses;
DROP TRIGGER IF EXISTS set_competitor_analyses_data_completeness ON public.competitor_analyses;

-- Recreate triggers with proper function calls
CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competitor_analyses_updated_at();

CREATE TRIGGER set_competitor_analyses_data_completeness
  BEFORE INSERT ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competitor_analyses_updated_at();

-- 3. Ensure all required columns exist with proper defaults
ALTER TABLE public.competitor_analyses 
  ALTER COLUMN data_quality_score SET DEFAULT 0,
  ALTER COLUMN data_completeness_score SET DEFAULT 0,
  ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Add missing status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_status') THEN
    CREATE TYPE analysis_status AS ENUM ('pending', 'analyzing', 'completed', 'failed', 'error');
  END IF;
END $$;