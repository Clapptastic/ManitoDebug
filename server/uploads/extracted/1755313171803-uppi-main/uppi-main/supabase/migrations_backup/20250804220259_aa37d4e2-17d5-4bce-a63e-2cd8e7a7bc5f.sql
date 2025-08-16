-- Fix remaining database function search_path issues

CREATE OR REPLACE FUNCTION public.calculate_enhanced_confidence_score(profile_data jsonb, source_weights jsonb DEFAULT '{}'::jsonb)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_score NUMERIC := 0;
  field_count INTEGER := 0;
  weight_multiplier NUMERIC;
BEGIN
  -- Basic scoring with source weights
  IF profile_data ? 'company_name' AND profile_data->>'company_name' != '' THEN
    weight_multiplier := COALESCE((source_weights->>'basic_info')::NUMERIC, 1.0);
    total_score := total_score + (10 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  IF profile_data ? 'revenue_estimate' AND (profile_data->>'revenue_estimate')::NUMERIC > 0 THEN
    weight_multiplier := COALESCE((source_weights->>'financial')::NUMERIC, 0.8);
    total_score := total_score + (15 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  IF profile_data ? 'employee_count' AND (profile_data->>'employee_count')::INTEGER > 0 THEN
    weight_multiplier := COALESCE((source_weights->>'personnel')::NUMERIC, 0.9);
    total_score := total_score + (10 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  IF field_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN LEAST(100, (total_score / field_count::NUMERIC));
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_data_completeness_score(analysis_record competitor_analyses)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    score NUMERIC := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
    analysis_data_score NUMERIC := 0;
    confidence_boost NUMERIC := 0;
BEGIN
    field_count := 20;
    
    IF analysis_record.name IS NOT NULL AND analysis_record.name != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.description IS NOT NULL AND analysis_record.description != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    -- Additional field checks...
    IF analysis_record.website_url IS NOT NULL AND analysis_record.website_url != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    IF analysis_record.industry IS NOT NULL AND analysis_record.industry != '' THEN
        filled_count := filled_count + 1;
    END IF;
    
    score := ((filled_count::NUMERIC / field_count::NUMERIC) * 70) + (analysis_data_score * 20) + confidence_boost;
    
    IF score > 100 THEN
        score := 100;
    ELSIF score < 0 THEN
        score := 0;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_company_name(company_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(company_name, '\s+(Inc\.?|LLC|Ltd\.?|Corporation|Corp\.?|Limited|Co\.?)$', '', 'i'),
          '\s+', ' ', 'g'
        ),
        '[^\w\s]', '', 'g'
      )
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_platform_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = $1 AND role = role_name
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$function$;