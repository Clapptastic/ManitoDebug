-- Create RPCs for profile upsert and linking (finalize)
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