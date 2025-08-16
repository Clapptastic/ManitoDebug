-- Phase 1 (Fixed): Critical Database Schema and RLS Fixes
-- Fix missing column and security issues

-- 1. Add missing ai_analysis_data column to company_profiles
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS ai_analysis_data JSONB DEFAULT '{}';

-- 2. Add RLS policies for tables without them
-- Fix lists table RLS (only if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lists'
  ) THEN
    ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own lists" 
    ON public.lists FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Fix system_settings table RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings'
  ) THEN
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Admins can manage system settings" 
    ON public.system_settings FOR ALL 
    USING (
      (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
      get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR 
      auth.role() = 'service_role'::text
    );
  END IF;
END $$;

-- 3. Fix function security by adding search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_role_result TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    -- Check if super admin first
    IF public.is_super_admin(user_email) THEN
        RETURN 'super_admin';
    END IF;
    
    -- Get role from user_roles table
    SELECT role INTO user_role_result 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(user_role_result, 'user');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN email_to_check IN ('akclapp@gmail.com', 'samdyer27@gmail.com');
END;
$function$;

-- 4. Add service role policies only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'system_components' 
    AND policyname = 'Service role can access system components'
  ) THEN
    CREATE POLICY "Service role can access system components" 
    ON public.system_components FOR ALL 
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON public.competitor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_user_project ON public.lists(user_id, project_id);

-- 6. Ensure edge function metrics policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'edge_function_metrics' 
    AND policyname = 'Service role can manage all edge function metrics'
  ) THEN
    CREATE POLICY "Service role can manage all edge function metrics" 
    ON public.edge_function_metrics FOR ALL 
    USING (auth.role() = 'service_role');
  END IF;
END $$;