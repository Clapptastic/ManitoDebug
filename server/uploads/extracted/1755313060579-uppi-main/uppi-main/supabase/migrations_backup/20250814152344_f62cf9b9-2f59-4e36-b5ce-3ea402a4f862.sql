-- Fix search_path for all functions to address security linter warning
-- This addresses the Function Search Path Mutable security issue

-- Update all existing functions to set search_path to 'public'
-- This prevents potential privilege escalation attacks

ALTER FUNCTION public.touch_updated_at() SET search_path = 'public';
ALTER FUNCTION public.is_admin_user(uuid) SET search_path = 'public';
ALTER FUNCTION public.can_access_api_key(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.log_security_event(uuid, text, text, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_flow_test_runs() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_analysis_runs() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.handle_profile_update() SET search_path = 'public';
ALTER FUNCTION public.reset_user_password(text) SET search_path = 'public';
ALTER FUNCTION public.exec_sql(text) SET search_path = 'public';
ALTER FUNCTION public.log_api_key_access() SET search_path = 'public';
ALTER FUNCTION public.get_effective_feature_flag(text, uuid) SET search_path = 'public';
ALTER FUNCTION public.set_prompt_version() SET search_path = 'public';
ALTER FUNCTION public.increment_helpful_count(uuid) SET search_path = 'public';
ALTER FUNCTION public.increment_not_helpful_count(uuid) SET search_path = 'public';
ALTER FUNCTION public.start_transaction_log(uuid, text, integer, jsonb) SET search_path = 'public';
ALTER FUNCTION public.check_organization_permission(uuid, uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_user_organizations(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_transaction_step(text, integer, jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.complete_transaction(text, boolean) SET search_path = 'public';
ALTER FUNCTION public.get_schema_overview(text) SET search_path = 'public';
ALTER FUNCTION public.insert_analysis_run(uuid, text, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.set_feature_flag(text, text, uuid, boolean) SET search_path = 'public';
ALTER FUNCTION public.increment_admin_key_usage(uuid, integer) SET search_path = 'public';
ALTER FUNCTION public.handle_system_operation(text, uuid) SET search_path = 'public';
ALTER FUNCTION public.rollback_transaction(text, text) SET search_path = 'public';
ALTER FUNCTION public.list_functions(text) SET search_path = 'public';
ALTER FUNCTION public.insert_flow_test_run(text, text, text, jsonb, jsonb, boolean, jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.automated_data_retention() SET search_path = 'public';
ALTER FUNCTION public.increment_wireframe_version() SET search_path = 'public';
ALTER FUNCTION public.log_ai_prompt(text, text, text, integer, uuid, text, numeric, text, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.get_user_competitor_analyses(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_last_flow_test_runs(text, integer) SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_progress() SET search_path = 'public';
ALTER FUNCTION public.update_code_embeddings_updated_at() SET search_path = 'public';
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
ALTER FUNCTION public.validate_api_key_integrity(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_super_admin(text) SET search_path = 'public';
ALTER FUNCTION public.debug_auth_context() SET search_path = 'public';
ALTER FUNCTION public.detect_security_anomalies() SET search_path = 'public';
ALTER FUNCTION public.get_user_role(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_api_key_operation(text, text, uuid, boolean, text) SET search_path = 'public';
ALTER FUNCTION public.manage_api_key(text, uuid, text, text, text, text, text, uuid) SET search_path = 'public';
ALTER FUNCTION public.test_policy_access(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_user_monthly_spend(uuid) SET search_path = 'public';
ALTER FUNCTION public.check_user_cost_allowed(uuid, numeric) SET search_path = 'public';
ALTER FUNCTION public.set_user_cost_limit(uuid, numeric, numeric) SET search_path = 'public';
ALTER FUNCTION public.test_auth_and_permissions() SET search_path = 'public';
ALTER FUNCTION public.is_member_of_team(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.set_user_provider_cost(uuid, text, numeric, integer) SET search_path = 'public';
ALTER FUNCTION public.update_user_provider_costs_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_user_provider_costs(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_competitor_analysis_progress(text, uuid) SET search_path = 'public';
ALTER FUNCTION public.set_user_provider_monthly_limit(uuid, text, numeric) SET search_path = 'public';
ALTER FUNCTION public.insert_competitor_analysis_progress(text, uuid, integer, jsonb) SET search_path = 'public';
ALTER FUNCTION public.update_competitor_analysis_progress(text, text, numeric, integer, text, text, jsonb) SET search_path = 'public';