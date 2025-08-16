# 🛠️ Complete Code Templates for AI Implementation

## 📁 EXACT FILE STRUCTURE DIRECTORY TREE

```
src/
├── components/
│   ├── admin/
│   │   ├── SuperAdminPage.tsx
│   │   ├── PermissionsPage.tsx
│   │   ├── PackageUpdatesPage.tsx
│   │   ├── MicroservicesPage.tsx
│   │   └── SystemHealthDashboard.tsx
│   ├── analytics/
│   │   ├── AdvancedAnalyticsDashboard.tsx (PRIMARY)
│   │   ├── TeamAnalyticsSection.tsx
│   │   └── PerformanceMetrics.tsx
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── business-tools/
│   │   ├── BusinessToolsHub.tsx
│   │   ├── MVPBuilder.tsx
│   │   ├── ScaleTools.tsx
│   │   └── BusinessPlanEditor.tsx
│   ├── teams/
│   │   ├── TeamWorkspace.tsx
│   │   ├── TeamMemberList.tsx
│   │   ├── InviteMemberModal.tsx
│   │   ├── TeamActivityFeed.tsx
│   │   ├── TeamCollaborationMetrics.tsx
│   │   ├── TeamNotifications.tsx
│   │   └── CollaborationIndicators.tsx
│   ├── test-measure-learn/
│   │   ├── TestMeasureLearnFramework.tsx
│   │   ├── WebAnalyticsInterface.tsx
│   │   └── ABTestingPanel.tsx
│   ├── market-research/
│   │   ├── CompetitorAnalysisPanel.tsx
│   │   ├── MarketAnalystInterface.tsx
│   │   └── TrendVisualization.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   ├── TeamOnboardingStep.tsx
│   │   └── TeamMemberOnboarding.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   ├── Navigation.tsx
│   │   └── TeamContextProvider.tsx
│   ├── ui/ (existing shadcn components)
│   └── legacy/ (archived components)
├── pages/
│   ├── admin/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── SuperAdminPage.tsx
│   │   ├── PermissionsPage.tsx
│   │   ├── PackageUpdatesPage.tsx
│   │   ├── MicroservicesPage.tsx
│   │   └── TeamAdminPage.tsx
│   ├── business-tools/
│   │   ├── BusinessToolsPage.tsx (PRIMARY)
│   │   ├── MVPPage.tsx
│   │   ├── ScalePage.tsx
│   │   └── ResearchValidationPage.tsx
│   ├── teams/
│   │   ├── TeamsPage.tsx
│   │   ├── CreateTeamPage.tsx
│   │   ├── TeamWorkspacePage.tsx
│   │   ├── TeamSettingsPage.tsx
│   │   └── TeamMembersPage.tsx
│   ├── test-measure-learn/
│   │   ├── TestMeasureLearnPage.tsx (PRIMARY)
│   │   ├── WebAnalyticsPage.tsx
│   │   └── ABTestingPage.tsx
│   ├── market-research/
│   │   ├── MarketResearchOverview.tsx
│   │   ├── CompetitorAnalysisPage.tsx
│   │   └── SavedMarketAnalysesPage.tsx
│   ├── tools/
│   │   ├── CodeWikiPage.tsx
│   │   ├── CodeEmbeddingsPage.tsx
│   │   └── SchemaViewerPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx (PRIMARY)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── AuthPage.tsx
│   ├── legacy/ (archived pages)
│   ├── HomePage.tsx
│   ├── LandingPage.tsx
│   ├── AnalyticsDashboardPage.tsx
│   └── BusinessPlanPage.tsx
├── services/
│   ├── edgeFunctions/
│   │   ├── marketAnalyst.ts
│   │   ├── marketDataFetcher.ts
│   │   ├── trendAnalyzer.ts
│   │   ├── comprehensiveAnalysis.ts
│   │   ├── threatCalculator.ts
│   │   ├── aiCofounderChat.ts
│   │   ├── aiValidation.ts
│   │   ├── documentProcessor.ts
│   │   ├── pdfGenerator.ts
│   │   ├── systemHealth.ts
│   │   ├── microserviceHealth.ts
│   │   ├── securityAudit.ts
│   │   ├── codeEmbeddings.ts
│   │   ├── typeCoverage.ts
│   │   ├── userManagement.ts
│   │   └── teamCollaboration.ts
│   ├── teams/
│   │   ├── teamService.ts
│   │   ├── invitationService.ts
│   │   ├── collaborationService.ts
│   │   └── teamAnalytics.ts
│   ├── business/
│   │   ├── businessPlanService.ts
│   │   ├── mvpService.ts
│   │   └── scaleService.ts
│   ├── analytics/
│   │   ├── analyticsService.ts
│   │   ├── performanceService.ts
│   │   └── reportingService.ts
│   └── auth/
│       ├── authService.ts
│       └── permissionService.ts
├── hooks/
│   ├── auth/
│   │   ├── useAuthContext.ts (PRIMARY - remove .tsx duplicate)
│   │   ├── usePermissions.ts
│   │   └── useAuth.ts
│   ├── teams/
│   │   ├── useTeams.ts
│   │   ├── useTeamMembers.ts
│   │   ├── useTeamCollaboration.ts
│   │   └── useTeamNotifications.ts
│   ├── business/
│   │   ├── useBusinessPlan.ts
│   │   ├── useMVPProjects.ts
│   │   └── useScaleMetrics.ts
│   ├── analytics/
│   │   ├── useAnalytics.ts
│   │   └── usePerformanceMetrics.ts
│   └── common/
│       ├── useRealtime.ts
│       ├── useNotifications.ts
│       └── useSubscription.ts
├── types/
│   ├── auth/
│   │   ├── roles.ts (existing)
│   │   ├── permissions.ts
│   │   └── user.ts
│   ├── teams/
│   │   ├── team.ts
│   │   ├── teamMember.ts
│   │   ├── invitation.ts
│   │   └── collaboration.ts
│   ├── business/
│   │   ├── businessPlan.ts
│   │   ├── mvpProject.ts
│   │   └── scaleMetrics.ts
│   ├── analytics/
│   │   ├── analytics.ts
│   │   └── performance.ts
│   └── api/
│       ├── edgeFunction.ts
│       └── response.ts
├── lib/
│   ├── supabase/
│   │   └── client.ts (existing)
│   ├── validation/
│   │   ├── teamValidation.ts
│   │   ├── businessValidation.ts
│   │   └── authValidation.ts
│   └── utils/
│       ├── teamUtils.ts
│       ├── collaborationUtils.ts
│       └── performanceUtils.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── TeamContext.tsx
│   ├── AnalyticsContext.tsx
│   └── PerformanceContext.tsx
└── __tests__/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    ├── utils/
    └── integration/

supabase/
├── functions/
│   ├── team-management/
│   │   └── index.ts
│   ├── team-invitations/
│   │   └── index.ts
│   ├── ai-market-analyst/
│   │   └── index.ts
│   ├── comprehensive-competitor-analysis/
│   │   └── index.ts
│   ├── ai-cofounder-chat/
│   │   └── index.ts
│   ├── document-processing/
│   │   └── index.ts
│   ├── system-health/
│   │   └── index.ts
│   ├── user-management/
│   │   └── index.ts
│   ├── check-subscription/
│   │   └── index.ts
│   ├── create-checkout/
│   │   └── index.ts
│   └── customer-portal/
│       └── index.ts
├── migrations/
│   ├── 20250806000001_team_collaboration_foundation.sql
│   ├── 20250806000002_business_tools_tables.sql
│   ├── 20250806000003_team_rls_policies.sql
│   ├── 20250806000004_performance_tables.sql
│   └── rollback/
│       ├── 20250806000001_team_collaboration_foundation_rollback.sql
│       ├── 20250806000002_business_tools_tables_rollback.sql
│       ├── 20250806000003_team_rls_policies_rollback.sql
│       └── 20250806000004_performance_tables_rollback.sql
└── config.toml
```

## 🔧 COMPLETE MIGRATION SCRIPTS WITH ROLLBACK

### Migration Script Template:
```sql
-- Migration: 20250806000001_team_collaboration_foundation.sql
-- Description: Create core team collaboration tables and functions
-- Author: AI Implementation Agent
-- Date: 2025-08-06

BEGIN;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'team_basic',
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{"collaboration_features": true, "notifications": true}'::jsonb,
    status TEXT DEFAULT 'active'
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{"read": true, "write": false, "invite": false}'::jsonb,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    UNIQUE(team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    role TEXT DEFAULT 'member',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
    expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_activity_log table
CREATE TABLE IF NOT EXISTS team_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_comments table
CREATE TABLE IF NOT EXISTS team_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES team_comments(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all team tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_comments ENABLE ROW LEVEL SECURITY;

-- Create team permission checking function
CREATE OR REPLACE FUNCTION check_team_permission(team_id UUID, user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = $1 AND tm.user_id = $2 
        AND tm.status = 'active'
        AND (tm.permissions->>required_permission)::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create team activity logging function
CREATE OR REPLACE FUNCTION log_team_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO team_activity_log (team_id, user_id, action, resource_type, resource_id, metadata)
    VALUES (
        COALESCE(NEW.team_id, OLD.team_id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_comments_updated_at
    BEFORE UPDATE ON team_comments
    FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_activity_team_id ON team_activity_log(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_user_id ON team_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_created_at ON team_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_team_comments_team_id ON team_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_comments_resource ON team_comments(resource_type, resource_id);

COMMIT;
```

### Rollback Script Template:
```sql
-- Rollback: 20250806000001_team_collaboration_foundation_rollback.sql
-- Description: Rollback team collaboration foundation migration
-- Author: AI Implementation Agent
-- Date: 2025-08-06

BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_team_comments_updated_at ON team_comments;

-- Drop functions
DROP FUNCTION IF EXISTS update_team_updated_at();
DROP FUNCTION IF EXISTS log_team_activity();
DROP FUNCTION IF EXISTS check_team_permission(UUID, UUID, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_teams_owner_id;
DROP INDEX IF EXISTS idx_team_members_team_id;
DROP INDEX IF EXISTS idx_team_members_user_id;
DROP INDEX IF EXISTS idx_team_members_status;
DROP INDEX IF EXISTS idx_team_invitations_team_id;
DROP INDEX IF EXISTS idx_team_invitations_email;
DROP INDEX IF EXISTS idx_team_invitations_token;
DROP INDEX IF EXISTS idx_team_activity_team_id;
DROP INDEX IF EXISTS idx_team_activity_user_id;
DROP INDEX IF EXISTS idx_team_activity_created_at;
DROP INDEX IF EXISTS idx_team_comments_team_id;
DROP INDEX IF EXISTS idx_team_comments_resource;

-- Drop tables in correct order (reverse of creation)
DROP TABLE IF EXISTS team_comments;
DROP TABLE IF EXISTS team_activity_log;
DROP TABLE IF EXISTS team_invitations;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;

COMMIT;
```

## 📋 STANDARDIZED CODE PATTERNS

### 1. Service Layer Pattern:
```typescript
// Template: src/services/teams/teamService.ts
import { supabase } from '@/lib/supabase/client';
import { Team, CreateTeamData, TeamResponse } from '@/types/teams/team';

export class TeamService {
  /**
   * Get all teams for the current user
   * @returns Promise<TeamResponse<Team[]>>
   */
  static async getUserTeams(): Promise<TeamResponse<Team[]>> {
    try {
      const { data, error } = await supabase.functions.invoke('team-management', {
        body: { action: 'getUserTeams' }
      });

      if (error) throw error;

      return {
        success: true,
        data: data.teams,
        message: 'Teams retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        message: 'Failed to retrieve teams'
      };
    }
  }

  /**
   * Create a new team
   * @param teamData - Team creation data
   * @returns Promise<TeamResponse<Team>>
   */
  static async createTeam(teamData: CreateTeamData): Promise<TeamResponse<Team>> {
    try {
      const { data, error } = await supabase.functions.invoke('team-management', {
        body: { action: 'createTeam', data: teamData }
      });

      if (error) throw error;

      return {
        success: true,
        data: data.team,
        message: 'Team created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        message: 'Failed to create team'
      };
    }
  }

  /**
   * Invite member to team
   * @param teamId - Team ID
   * @param email - Member email
   * @param role - Member role
   * @returns Promise<TeamResponse<void>>
   */
  static async inviteMember(
    teamId: string, 
    email: string, 
    role: string
  ): Promise<TeamResponse<void>> {
    try {
      const { data, error } = await supabase.functions.invoke('team-invitations', {
        body: { action: 'sendInvitation', teamId, email, role }
      });

      if (error) throw error;

      return {
        success: true,
        data: undefined,
        message: 'Invitation sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        error: error.message,
        message: 'Failed to send invitation'
      };
    }
  }
}
```

### 2. React Hook Pattern:
```typescript
// Template: src/hooks/teams/useTeams.ts
import { useState, useCallback, useEffect } from 'react';
import { TeamService } from '@/services/teams/teamService';
import { Team } from '@/types/teams/team';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/hooks/use-toast';

interface UseTeamsReturn {
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  createTeam: (teamData: CreateTeamData) => Promise<Team | null>;
  switchTeam: (teamId: string) => void;
  inviteMember: (teamId: string, email: string, role: string) => Promise<boolean>;
}

export const useTeams = (): UseTeamsReturn => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeams = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const response = await TeamService.getUserTeams();
    
    if (response.success) {
      setTeams(response.data);
      if (response.data.length > 0 && !currentTeam) {
        setCurrentTeam(response.data[0]);
      }
    } else {
      setError(response.error || 'Failed to fetch teams');
      toast({
        title: 'Error',
        description: response.message,
        variant: 'destructive'
      });
    }

    setLoading(false);
  }, [user, currentTeam]);

  const createTeam = useCallback(async (teamData: CreateTeamData): Promise<Team | null> => {
    setLoading(true);
    setError(null);

    const response = await TeamService.createTeam(teamData);
    
    if (response.success) {
      await fetchTeams(); // Refresh teams list
      toast({
        title: 'Success',
        description: response.message
      });
      return response.data;
    } else {
      setError(response.error || 'Failed to create team');
      toast({
        title: 'Error',
        description: response.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchTeams]);

  const switchTeam = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      localStorage.setItem('currentTeamId', teamId);
    }
  }, [teams]);

  const inviteMember = useCallback(async (
    teamId: string, 
    email: string, 
    role: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await TeamService.inviteMember(teamId, email, role);
    
    if (response.success) {
      toast({
        title: 'Success',
        description: response.message
      });
      return true;
    } else {
      setError(response.error || 'Failed to invite member');
      toast({
        title: 'Error',
        description: response.message,
        variant: 'destructive'
      });
      return false;
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    // Restore current team from localStorage
    const savedTeamId = localStorage.getItem('currentTeamId');
    if (savedTeamId && teams.length > 0) {
      const savedTeam = teams.find(t => t.id === savedTeamId);
      if (savedTeam) {
        setCurrentTeam(savedTeam);
      }
    }
  }, [teams]);

  return {
    teams,
    currentTeam,
    loading,
    error,
    fetchTeams,
    createTeam,
    switchTeam,
    inviteMember
  };
};
```

### 3. React Component Pattern:
```typescript
// Template: src/components/teams/TeamWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeams } from '@/hooks/teams/useTeams';
import { TeamActivityFeed } from './TeamActivityFeed';
import { TeamMemberList } from './TeamMemberList';
import { InviteMemberModal } from './InviteMemberModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle } from 'lucide-react';

interface TeamWorkspaceProps {
  teamId: string;
}

export const TeamWorkspace: React.FC<TeamWorkspaceProps> = ({ teamId }) => {
  const { currentTeam, loading, error } = useTeams();
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentTeam) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Team not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentTeam.name}</CardTitle>
              <p className="text-muted-foreground">{currentTeam.description}</p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              Invite Member
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Team Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamActivityFeed teamId={teamId} />
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamMemberList teamId={teamId} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        teamId={teamId}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
```

### 4. Edge Function Pattern:
```typescript
// Template: supabase/functions/team-management/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamManagementRequest {
  action: 'getUserTeams' | 'createTeam' | 'updateTeam' | 'deleteTeam';
  data?: any;
  teamId?: string;
}

interface TeamManagementResponse {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEAM-MANAGEMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const requestBody: TeamManagementRequest = await req.json();
    const { action, data, teamId } = requestBody;

    let response: TeamManagementResponse;

    switch (action) {
      case 'getUserTeams':
        response = await getUserTeams(supabaseClient, user.id);
        break;
      
      case 'createTeam':
        response = await createTeam(supabaseClient, user.id, data);
        break;
      
      case 'updateTeam':
        response = await updateTeam(supabaseClient, user.id, teamId!, data);
        break;
      
      case 'deleteTeam':
        response = await deleteTeam(supabaseClient, user.id, teamId!);
        break;
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    logStep("Operation completed", { action, success: response.success });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.success ? 200 : 400,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    const errorResponse: TeamManagementResponse = {
      success: false,
      error: errorMessage,
      message: "Team management operation failed"
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper functions
async function getUserTeams(supabase: any, userId: string): Promise<TeamManagementResponse> {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner (
          role,
          status,
          joined_at
        )
      `)
      .eq('team_members.user_id', userId)
      .eq('team_members.status', 'active');

    if (error) throw error;

    return {
      success: true,
      data: { teams },
      message: "Teams retrieved successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to retrieve teams"
    };
  }
}

async function createTeam(supabase: any, userId: string, teamData: any): Promise<TeamManagementResponse> {
  try {
    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description,
        owner_id: userId,
        subscription_tier: teamData.subscription_tier || 'team_basic'
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add owner as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        permissions: {
          read: true,
          write: true,
          invite: true,
          manage: true
        }
      });

    if (memberError) throw memberError;

    return {
      success: true,
      data: { team },
      message: "Team created successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to create team"
    };
  }
}

async function updateTeam(supabase: any, userId: string, teamId: string, teamData: any): Promise<TeamManagementResponse> {
  try {
    // Check if user is team owner
    const { data: team, error: checkError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (checkError) throw checkError;
    if (team.owner_id !== userId) throw new Error("Only team owners can update teams");

    // Update team
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update(teamData)
      .eq('id', teamId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      data: { team: updatedTeam },
      message: "Team updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to update team"
    };
  }
}

async function deleteTeam(supabase: any, userId: string, teamId: string): Promise<TeamManagementResponse> {
  try {
    // Check if user is team owner
    const { data: team, error: checkError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (checkError) throw checkError;
    if (team.owner_id !== userId) throw new Error("Only team owners can delete teams");

    // Delete team (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: "Team deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to delete team"
    };
  }
}
```

### 5. TypeScript Interface Pattern:
```typescript
// Template: src/types/teams/team.ts
export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  subscription_tier: TeamSubscriptionTier;
  max_members: number;
  created_at: string;
  updated_at: string;
  settings: TeamSettings;
  status: TeamStatus;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  permissions: TeamPermissions;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  status: TeamMemberStatus;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  role: TeamRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  status: InvitationStatus;
  created_at: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  subscription_tier?: TeamSubscriptionTier;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  settings?: Partial<TeamSettings>;
}

export interface TeamSettings {
  collaboration_features: boolean;
  notifications: boolean;
  auto_accept_invitations?: boolean;
  require_approval_for_sharing?: boolean;
}

export interface TeamPermissions {
  read: boolean;
  write: boolean;
  invite: boolean;
  manage?: boolean;
}

export interface TeamResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message: string;
}

export interface TeamActivity {
  id: string;
  team_id: string;
  user_id: string;
  user_name?: string;
  action: TeamActivityAction;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TeamComment {
  id: string;
  team_id: string;
  user_id: string;
  user_name?: string;
  resource_type: string;
  resource_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

// Enums
export type TeamSubscriptionTier = 'team_basic' | 'team_premium' | 'team_enterprise';
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamStatus = 'active' | 'suspended' | 'cancelled';
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type TeamActivityAction = 'created' | 'updated' | 'shared' | 'commented' | 'invited' | 'joined' | 'left';

// Constants
export const TEAM_SUBSCRIPTION_LIMITS = {
  team_basic: { max_members: 5, features: ['basic_collaboration'] },
  team_premium: { max_members: 15, features: ['basic_collaboration', 'advanced_analytics'] },
  team_enterprise: { max_members: 50, features: ['basic_collaboration', 'advanced_analytics', 'custom_integrations'] }
} as const;

export const DEFAULT_TEAM_PERMISSIONS = {
  owner: { read: true, write: true, invite: true, manage: true },
  admin: { read: true, write: true, invite: true, manage: false },
  member: { read: true, write: true, invite: false, manage: false },
  viewer: { read: true, write: false, invite: false, manage: false }
} as const;
```