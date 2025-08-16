-- Fix search path security for custom functions
ALTER FUNCTION public.get_user_role(uuid) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.has_platform_role(uuid, text) SET search_path = '';
ALTER FUNCTION public.insert_error_log(uuid, text, text, text, text, text, jsonb, text, text, text, text) SET search_path = '';
ALTER FUNCTION public.insert_performance_metric(uuid, text, numeric, jsonb) SET search_path = '';
ALTER FUNCTION public.is_admin_user() SET search_path = '';
ALTER FUNCTION public.is_user_admin(uuid) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';