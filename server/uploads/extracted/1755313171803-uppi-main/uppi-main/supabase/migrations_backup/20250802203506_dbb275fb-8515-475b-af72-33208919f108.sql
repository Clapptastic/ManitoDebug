-- Fix remaining Function Search Path Mutable warnings
-- Update other functions to have secure search_path

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.insert_error_log(uuid, text, text, text, text, text, jsonb, text, text, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.insert_error_log(
  p_user_id uuid, 
  p_error_type text, 
  p_error_message text, 
  p_error_stack text DEFAULT NULL::text, 
  p_component text DEFAULT NULL::text, 
  p_action text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb, 
  p_severity text DEFAULT 'medium'::text, 
  p_environment text DEFAULT 'development'::text, 
  p_user_agent text DEFAULT NULL::text, 
  p_url text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id, error_type, error_message, error_stack, component, action,
    metadata, severity, environment, user_agent, url
  )
  VALUES (
    p_user_id, p_error_type, p_error_message, p_error_stack, p_component, p_action,
    p_metadata, p_severity, p_environment, p_user_agent, p_url
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

DROP FUNCTION IF EXISTS public.insert_performance_metric(uuid, text, numeric, jsonb) CASCADE;
CREATE OR REPLACE FUNCTION public.insert_performance_metric(
  p_user_id uuid, 
  p_metric_name text, 
  p_metric_value numeric, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.performance_metrics (
    user_id, metric_name, metric_value, metadata
  )
  VALUES (
    p_user_id, p_metric_name, p_metric_value, p_metadata
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

-- Fix RLS tables without policies
-- Add basic policies for tables that have RLS enabled but no policies

-- Table: embeddings_status (already has policies, check if they need recreation)
DROP POLICY IF EXISTS "Users can manage their own embeddings status" ON public.embeddings_status;
CREATE POLICY "Users can manage their own embeddings status" 
ON public.embeddings_status 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);