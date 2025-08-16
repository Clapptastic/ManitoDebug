-- Phase 1 — Fix: re-define get_user_competitor_analyses to include company_profile_id
-- Ensure competitor_analyses has company_profile_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'competitor_analyses' AND column_name = 'company_profile_id'
  ) THEN
    ALTER TABLE public.competitor_analyses
    ADD COLUMN company_profile_id uuid NULL REFERENCES public.company_profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_competitor_analyses_company_profile_id ON public.competitor_analyses(company_profile_id);

-- Drop then recreate function with new return type
DROP FUNCTION IF EXISTS public.get_user_competitor_analyses(user_id_param uuid);

CREATE OR REPLACE FUNCTION public.get_user_competitor_analyses(user_id_param uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, user_id uuid, company_profile_id uuid, name text, website_url text, industry text, description text, employee_count integer, founded_year integer, headquarters text, business_model text, target_market text[], strengths text[], weaknesses text[], opportunities text[], threats text[], pricing_strategy jsonb, funding_info jsonb, social_media_presence jsonb, market_position text, analysis_data jsonb, confidence_scores jsonb, status text, created_at timestamptz, updated_at timestamptz, completed_at timestamptz, data_quality_score numeric, data_completeness_score numeric, market_sentiment_score numeric, actual_cost numeric, analysis_id uuid, session_id text, organization_id uuid, website_verified boolean, employee_count_verified boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := COALESCE(user_id_param, auth.uid());
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    ca.id,
    ca.user_id,
    ca.company_profile_id,
    ca.name,
    ca.website_url,
    ca.industry,
    ca.description,
    ca.employee_count,
    ca.founded_year,
    ca.headquarters,
    ca.business_model,
    ca.target_market,
    ca.strengths,
    ca.weaknesses,
    ca.opportunities,
    ca.threats,
    ca.pricing_strategy,
    ca.funding_info,
    ca.social_media_presence,
    ca.market_position,
    ca.analysis_data,
    ca.confidence_scores,
    ca.status,
    ca.created_at,
    ca.updated_at,
    ca.completed_at,
    ca.data_quality_score,
    ca.data_completeness_score,
    ca.market_sentiment_score,
    ca.actual_cost,
    ca.analysis_id,
    ca.session_id,
    ca.organization_id,
    ca.website_verified,
    ca.employee_count_verified
  FROM public.competitor_analyses ca
  WHERE ca.user_id = current_user_id
  ORDER BY ca.created_at DESC;
END;
$function$;