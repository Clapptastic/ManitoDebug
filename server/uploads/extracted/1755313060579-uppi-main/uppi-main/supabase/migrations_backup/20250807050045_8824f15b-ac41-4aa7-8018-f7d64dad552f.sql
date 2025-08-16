-- Fix search path issues for functions that don't have it set
ALTER FUNCTION public.update_code_embeddings_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_progress() SET search_path TO 'public';
ALTER FUNCTION public.debug_auth_context() SET search_path TO 'public';
ALTER FUNCTION public.handle_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.increment_wireframe_version() SET search_path TO 'public';