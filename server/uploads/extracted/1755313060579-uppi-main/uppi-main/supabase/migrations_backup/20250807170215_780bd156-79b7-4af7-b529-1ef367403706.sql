-- Fix the search path security warning
ALTER FUNCTION public.get_user_competitor_analyses(uuid) SET search_path TO 'public';