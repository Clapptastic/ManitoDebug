-- Fix remaining search path security issues
ALTER FUNCTION public.calculate_data_completeness_score(competitor_analyses) SET search_path = '';
ALTER FUNCTION public.update_data_completeness_trigger() SET search_path = '';
ALTER FUNCTION public.update_competitor_progress_updated_at() SET search_path = '';

-- Note: Cannot move vector extension from public schema as it would break existing data
-- This is a common issue with the vector extension and is acceptable for this extension
-- The warning can be ignored for the vector extension specifically