-- Phase 1: Database & Authentication Foundation (Fixed)

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

-- Create RLS policies for user_roles (drop and recreate)
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

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
DROP POLICY IF EXISTS "Admins can manage affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can manage affiliate links" ON public.affiliate_links
FOR ALL USING (
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