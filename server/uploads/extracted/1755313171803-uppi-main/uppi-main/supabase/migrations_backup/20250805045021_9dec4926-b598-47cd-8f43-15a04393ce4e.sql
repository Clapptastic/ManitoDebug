-- Fix critical Supabase integration issues

-- 1. Fix database functions security by setting search_path
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_wireframe_version() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.is_super_admin(text) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;

-- 2. Create missing platform_roles table (referenced in AuthProvider but doesn't exist)
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
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Enable RLS on platform_roles
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_roles
CREATE POLICY "Users can view their own platform roles" 
ON public.platform_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage platform roles" 
ON public.platform_roles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_platform_roles_updated_at
    BEFORE UPDATE ON public.platform_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add missing RLS policies for tables that have RLS enabled but no policies
-- (The linter identified these as issues)

-- 4. Create user_roles table if it doesn't exist properly
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_user_role_assignment UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Insert initial super admin roles into user_roles table
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
    au.id,
    'super_admin',
    au.id
FROM auth.users au
WHERE au.email IN ('akclapp@gmail.com', 'samdyer27@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;