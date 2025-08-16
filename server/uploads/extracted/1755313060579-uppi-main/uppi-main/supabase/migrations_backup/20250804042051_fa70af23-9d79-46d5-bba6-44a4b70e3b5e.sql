-- Fix security warnings by setting search_path for functions

-- Update normalize_company_name function
CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Remove common suffixes and normalize
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
$$;

-- Update calculate_enhanced_confidence_score function
CREATE OR REPLACE FUNCTION calculate_enhanced_confidence_score(profile_data JSONB, source_weights JSONB DEFAULT '{}')
RETURNS NUMERIC 
LANGUAGE plpgsql 
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Add more field-specific scoring...
  
  IF field_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN LEAST(100, (total_score / field_count::NUMERIC));
END;
$$;

-- Update update_master_profile_updated_at function
CREATE OR REPLACE FUNCTION update_master_profile_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.overall_confidence_score = calculate_enhanced_confidence_score(
    jsonb_build_object(
      'company_name', NEW.company_name,
      'revenue_estimate', NEW.revenue_estimate,
      'employee_count', NEW.employee_count,
      'description', NEW.description
    )
  );
  RETURN NEW;
END;
$$;