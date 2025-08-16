-- Phase 1: Database & Authentication Foundation

-- First, ensure the user has super admin role
INSERT INTO platform_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users 
WHERE email = 'akclapp@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.users.id AND role = 'super_admin'
);

-- Create user_roles table if not exists (for better role management)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for profiles to allow admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Fix platform_roles table structure if needed
ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.platform_roles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Enable RLS on platform_roles
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for platform_roles
DROP POLICY IF EXISTS "Super admins can manage platform roles" ON public.platform_roles;
CREATE POLICY "Super admins can manage platform roles" ON public.platform_roles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_roles pr
        WHERE pr.user_id = auth.uid() AND pr.role = 'super_admin'
    )
);

-- Create affiliate_links table if missing (referenced in admin-api)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    url text NOT NULL,
    affiliate_code text NOT NULL,
    status text DEFAULT 'active',
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on affiliate_links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for affiliate_links
CREATE POLICY "Admins can manage affiliate links" ON public.affiliate_links
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Update the get_user_role function to handle both tables
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    platform_role_result TEXT;
    user_role_result TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
    
    -- Check if super admin by email first
    IF public.is_super_admin(user_email) THEN
        RETURN 'super_admin';
    END IF;
    
    -- Get role from platform_roles table (highest priority)
    SELECT role INTO platform_role_result 
    FROM public.platform_roles 
    WHERE user_id = user_id_param 
    ORDER BY 
        CASE role 
            WHEN 'super_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'user' THEN 3
            ELSE 4
        END
    LIMIT 1;
    
    IF platform_role_result IS NOT NULL THEN
        RETURN platform_role_result;
    END IF;
    
    -- Get role from user_roles table as fallback
    SELECT role INTO user_role_result 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY 
        CASE role 
            WHEN 'super_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'user' THEN 3
            ELSE 4
        END
    LIMIT 1;
    
    RETURN COALESCE(user_role_result, 'user');
END;
$function$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Add updated_at triggers if they don't exist
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_roles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.platform_roles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.platform_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();