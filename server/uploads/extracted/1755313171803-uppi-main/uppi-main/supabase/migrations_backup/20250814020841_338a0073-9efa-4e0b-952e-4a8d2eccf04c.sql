-- Fix function search path security issue
ALTER FUNCTION public.safe_uuid_cast(TEXT) SET search_path = '';

-- Add error handling improvements for UUID parsing
CREATE OR REPLACE FUNCTION public.safe_uuid_cast(input_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF input_text IS NULL OR LENGTH(trim(input_text)) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Check if it's already a valid UUID format
  IF input_text ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
    RETURN input_text::UUID;
  END IF;
  
  -- If not valid UUID, return NULL instead of throwing error
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;