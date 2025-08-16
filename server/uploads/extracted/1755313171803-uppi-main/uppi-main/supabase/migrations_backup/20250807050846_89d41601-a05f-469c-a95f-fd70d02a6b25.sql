-- Phase 1: Create missing business tools tables
-- Customer support system tables
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, waiting, resolved, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  category TEXT, -- billing, technical, feature_request, bug_report
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team collaboration tables
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_tier TEXT DEFAULT 'team_basic', -- team_basic, team_premium, team_enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  status TEXT DEFAULT 'active', -- active, invited, inactive
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- Support ticket messages policies
CREATE POLICY "Users can view messages for their tickets"
ON support_ticket_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM support_tickets 
  WHERE support_tickets.id = support_ticket_messages.ticket_id 
  AND support_tickets.user_id = auth.uid()
));

CREATE POLICY "Users can create messages for their tickets"
ON support_ticket_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM support_tickets 
  WHERE support_tickets.id = support_ticket_messages.ticket_id 
  AND support_tickets.user_id = auth.uid()
) AND auth.uid() = user_id);

-- Knowledge base policies
CREATE POLICY "Published articles are viewable by everyone"
ON knowledge_base_articles FOR SELECT
USING (is_published = true);

CREATE POLICY "Users can view their own unpublished articles"
ON knowledge_base_articles FOR SELECT
USING (created_by = auth.uid());

-- Team policies
CREATE POLICY "Team members can view their teams"
ON teams FOR SELECT
USING (EXISTS (
  SELECT 1 FROM team_members 
  WHERE team_members.team_id = teams.id 
  AND team_members.user_id = auth.uid() 
  AND team_members.status = 'active'
));

CREATE POLICY "Team owners can update their teams"
ON teams FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams"
ON teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Team members can view team membership"
ON team_members FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM team_members tm2 
  WHERE tm2.team_id = team_members.team_id 
  AND tm2.user_id = auth.uid() 
  AND tm2.status = 'active'
));

-- Team invitations policies
CREATE POLICY "Users can view invitations sent to their email"
ON team_invitations FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_knowledge_base_articles_updated_at
  BEFORE UPDATE ON knowledge_base_articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();