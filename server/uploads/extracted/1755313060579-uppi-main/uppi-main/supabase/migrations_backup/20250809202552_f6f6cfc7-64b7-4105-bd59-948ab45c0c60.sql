-- Phase 1 — Company Profiles linkage using existing schema (company_profiles already exists)
-- Ensure helper columns exist
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz;

-- Unique per user on normalized company_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_company_profiles_user_norm_company_name'
  ) THEN
    ALTER TABLE public.company_profiles
    ADD CONSTRAINT uniq_company_profiles_user_norm_company_name
    UNIQUE (user_id, (lower(regexp_replace(company_name, '\\s+', '', 'g'))));
  END IF;
END$$;

-- Add company_profile_id to competitor_analyses and index
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

-- RPC: upsert_company_profile using existing columns (company_name, website_url, metadata)
CREATE OR REPLACE FUNCTION public.upsert_company_profile(
  user_id_param uuid,
  name_param text,
  website_url_param text,
  profile_data_param jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  norm_name text;
  existing_id uuid;
BEGIN
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  norm_name := lower(regexp_replace(COALESCE(name_param, ''), '\\s+', '', 'g'));

  -- Try match by normalized company_name
  IF norm_name <> '' THEN
    SELECT id INTO existing_id
    FROM public.company_profiles
    WHERE user_id = user_id_param AND lower(regexp_replace(company_name, '\\s+', '', 'g')) = norm_name
    LIMIT 1;
  END IF;

  -- Fallback: try match by website_url when present
  IF existing_id IS NULL AND website_url_param IS NOT NULL AND website_url_param <> '' THEN
    SELECT id INTO existing_id
    FROM public.company_profiles
    WHERE user_id = user_id_param AND lower(website_url) = lower(website_url_param)
    LIMIT 1;
  END IF;

  IF existing_id IS NULL THEN
    INSERT INTO public.company_profiles (user_id, company_name, website_url, description, metadata, ai_analysis_data, last_enriched_at)
    VALUES (user_id_param, COALESCE(name_param, ''), website_url_param, NULL, COALESCE(profile_data_param, '{}'::jsonb), '{}'::jsonb, now())
    RETURNING id INTO existing_id;
  ELSE
    UPDATE public.company_profiles
    SET 
      company_name = COALESCE(name_param, company_name),
      website_url = COALESCE(website_url_param, website_url),
      metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(profile_data_param, '{}'::jsonb),
      last_enriched_at = now(),
      updated_at = now()
    WHERE id = existing_id;
  END IF;

  RETURN existing_id;
END;
$$;

-- RPC: link_analysis_to_company (unchanged)
CREATE OR REPLACE FUNCTION public.link_analysis_to_company(
  analysis_id_param uuid,
  company_profile_id_param uuid,
  user_id_param uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF analysis_id_param IS NULL OR company_profile_id_param IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.competitor_analyses
  SET company_profile_id = company_profile_id_param, updated_at = now()
  WHERE analysis_id = analysis_id_param AND user_id = user_id_param;

  RETURN FOUND;
END;
$$;

-- Update get_user_competitor_analyses to include company_profile_id
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