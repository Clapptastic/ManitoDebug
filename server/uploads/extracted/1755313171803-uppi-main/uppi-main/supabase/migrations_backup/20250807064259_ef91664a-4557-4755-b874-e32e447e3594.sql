-- Phase 1: Team Collaboration Tables
-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  plan_type TEXT DEFAULT 'free',
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '["read"]',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID,
  status TEXT DEFAULT 'active',
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared workspaces table
CREATE TABLE public.shared_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workspace_type TEXT DEFAULT 'general',
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_workspaces ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Team owners can manage their teams" 
ON public.teams 
FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their teams" 
ON public.teams 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid() AND status = 'active'
  )
);

-- Team members policies
CREATE POLICY "Team members can view team members" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.status = 'active'
  )
);

CREATE POLICY "Team owners can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_members.team_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own membership" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Team invitations policies
CREATE POLICY "Team owners can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_invitations.team_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Invited users can view their invitations" 
ON public.team_invitations 
FOR SELECT 
USING (
  email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Shared workspaces policies
CREATE POLICY "Team members can access shared workspaces" 
ON public.shared_workspaces 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = shared_workspaces.team_id AND user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Team owners can manage shared workspaces" 
ON public.shared_workspaces 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = shared_workspaces.team_id AND owner_id = auth.uid()
  )
);

-- Add update triggers
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_workspaces_updated_at
  BEFORE UPDATE ON public.shared_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();