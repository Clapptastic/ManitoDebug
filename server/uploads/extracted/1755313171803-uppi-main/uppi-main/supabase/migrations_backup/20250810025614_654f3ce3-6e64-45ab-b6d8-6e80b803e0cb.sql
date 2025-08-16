-- Seed competitor_analysis feature flag in a schema-agnostic way (fixed EXECUTE syntax)
DO $$
DECLARE
  has_flag_key boolean;
  has_flag_name boolean;
  exists_row boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='feature_flags' AND column_name='flag_key'
  ) INTO has_flag_key;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='feature_flags' AND column_name='flag_name'
  ) INTO has_flag_name;

  IF has_flag_key THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.feature_flags WHERE flag_key = ''competitor_analysis'')' INTO exists_row;
  ELSIF has_flag_name THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.feature_flags WHERE flag_name = ''competitor_analysis'')' INTO exists_row;
  ELSE
    exists_row := true;
  END IF;

  IF NOT exists_row THEN
    IF has_flag_key AND has_flag_name THEN
      EXECUTE 'INSERT INTO public.feature_flags (flag_name, flag_key, description, value, is_enabled)
               VALUES (''competitor_analysis'', ''competitor_analysis'', ''Global enable/disable for Competitor Analysis feature'', ''{""version"": ""v1""}'', true)';
    ELSIF has_flag_key THEN
      EXECUTE 'INSERT INTO public.feature_flags (flag_key, description, value, is_enabled)
               VALUES (''competitor_analysis'', ''Global enable/disable for Competitor Analysis feature'', ''{""version"": ""v1""}'', true)';
    ELSIF has_flag_name THEN
      EXECUTE 'INSERT INTO public.feature_flags (flag_name, description, is_enabled)
               VALUES (''competitor_analysis'', ''Global enable/disable for Competitor Analysis feature'', true)';
    END IF;
  END IF;
END$$;