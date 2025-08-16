-- 1) Add missing column to competitor_analyses for confidence metrics
ALTER TABLE public.competitor_analyses
ADD COLUMN IF NOT EXISTS confidence_scores jsonb;

-- 2) Replace get_user_competitor_analyses to include new column
DROP FUNCTION IF EXISTS public.get_user_competitor_analyses(uuid);

CREATE FUNCTION public.get_user_competitor_analyses(user_id_param uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
  id uuid,
  user_id uuid,
  name text,
  website_url text,
  industry text,
  description text,
  employee_count integer,
  founded_year integer,
  headquarters text,
  business_model text,
  target_market text[],
  strengths text[],
  weaknesses text[],
  opportunities text[],
  threats text[],
  pricing_strategy jsonb,
  funding_info jsonb,
  social_media_presence jsonb,
  market_position text,
  analysis_data jsonb,
  confidence_scores jsonb,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  completed_at timestamp with time zone,
  data_quality_score numeric,
  data_completeness_score numeric,
  market_sentiment_score numeric,
  actual_cost numeric,
  analysis_id uuid,
  session_id text,
  organization_id uuid,
  website_verified boolean,
  employee_count_verified boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return empty if no user
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return user's competitor analyses
  RETURN QUERY
  SELECT 
    ca.id,
    ca.user_id,
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