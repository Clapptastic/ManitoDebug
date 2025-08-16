-- Fix remaining function search path issues (excluding vector function)
-- Set search_path for all remaining functions that need it

-- Fix all remaining functions that don't have search_path set
ALTER FUNCTION public.exec_sql(text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_profile_update() SET search_path = public;
ALTER FUNCTION public.reset_user_password(text) SET search_path = public;
ALTER FUNCTION public.increment_admin_key_usage(uuid, integer) SET search_path = public;
ALTER FUNCTION public.manage_api_key(text, uuid, text, text, text, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.update_code_embeddings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_progress() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_wireframe_version() SET search_path = public;
ALTER FUNCTION public.is_super_admin(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;