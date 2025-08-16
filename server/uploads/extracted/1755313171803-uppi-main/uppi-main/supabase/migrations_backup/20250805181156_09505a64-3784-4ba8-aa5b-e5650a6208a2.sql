-- Phase 1 Continued: Organization Management and Enhanced User System

-- 1. Organizations Table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  settings JSONB DEFAULT '{}'::JSONB,
  subscription_tier TEXT DEFAULT 'free'::TEXT CHECK (subscription_tier IN ('free', 'pro', 'business', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Organization Members Table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'::TEXT CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '[]'::JSONB,
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Organization Invitations Table
CREATE TABLE public.organization_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'::TEXT CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending'::TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Enhanced Profiles Table (update existing)
-- Add organization-related fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  current_organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  preferences JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create RLS Policies for Organizations

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations FOR SELECT 
USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Organization owners and admins can update organizations" 
ON public.organizations FOR UPDATE 
USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

CREATE POLICY "Users can create organizations" 
ON public.organizations FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Organization members policies
CREATE POLICY "Users can view organization members of their organizations" 
ON public.organization_members FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members AS om
    WHERE om.user_id = auth.uid() AND om.is_active = true
  )
);

CREATE POLICY "Organization admins can manage members" 
ON public.organization_members FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members AS om
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin') 
    AND om.is_active = true
  )
);

CREATE POLICY "Users can join organizations they're invited to" 
ON public.organization_members FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM public.organization_invitations 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    AND status = 'accepted'
  )
);

-- Organization invitations policies
CREATE POLICY "Users can view invitations for their organizations" 
ON public.organization_invitations FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
  ) OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Organization admins can manage invitations" 
ON public.organization_invitations FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_invitations_updated_at
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create organization management functions
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    o.id,
    o.name,
    om.role,
    om.is_active
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = user_id_param AND om.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_permission(
  user_id_param UUID,
  org_id_param UUID,
  required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_id_param 
    AND organization_id = org_id_param 
    AND role = ANY (
      CASE required_role
        WHEN 'owner' THEN ARRAY['owner']
        WHEN 'admin' THEN ARRAY['owner', 'admin']
        WHEN 'manager' THEN ARRAY['owner', 'admin', 'manager']
        WHEN 'member' THEN ARRAY['owner', 'admin', 'manager', 'member']
        ELSE ARRAY['owner', 'admin', 'manager', 'member', 'viewer']
      END
    )
    AND is_active = true
  );
$$;