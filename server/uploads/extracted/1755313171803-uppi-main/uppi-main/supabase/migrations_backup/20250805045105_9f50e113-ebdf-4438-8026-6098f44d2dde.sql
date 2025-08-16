-- Fix critical Supabase integration issues (simplified)

-- 1. Fix database functions security by setting search_path (only missing ones)
DO $$
BEGIN
    -- Only alter functions that don't already have search_path set
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_updated_at' 
        AND n.nspname = 'public'
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
        ALTER FUNCTION public.handle_updated_at() SET search_path = public;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'increment_wireframe_version' 
        AND n.nspname = 'public'
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
        ALTER FUNCTION public.increment_wireframe_version() SET search_path = public;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'update_updated_at_column' 
        AND n.nspname = 'public'
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'is_super_admin' 
        AND n.nspname = 'public'
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
        ALTER FUNCTION public.is_super_admin(text) SET search_path = public;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_user_role' 
        AND n.nspname = 'public'
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
        ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
    END IF;
END $$;

-- 2. Create missing platform_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_user_platform_role UNIQUE (user_id, role)
);

-- Enable RLS on platform_roles if table was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'platform_roles' 
        AND policyname = 'Users can view their own platform roles'
    ) THEN
        ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own platform roles" 
        ON public.platform_roles 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "System can manage platform roles" 
        ON public.platform_roles 
        FOR ALL 
        USING (auth.role() = 'service_role');
    END IF;
END $$;