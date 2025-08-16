import { useState, useEffect } from 'react';
import { 
  teamCollaborationService, 
  Team, 
  TeamMember, 
  TeamInvitation, 
  SharedWorkspace,
  CreateTeamRequest,
  InviteTeamMemberRequest,
  CreateWorkspaceRequest
} from '@/services/core/teamCollaborationService';
import { toast } from 'sonner';

interface UseTeamCollaborationReturn {
  teams: Team[];
  selectedTeam: Team | null;
  teamMembers: TeamMember[];
  teamInvitations: TeamInvitation[];
  userInvitations: TeamInvitation[];
  teamWorkspaces: SharedWorkspace[];
  isLoading: boolean;
  selectTeam: (team: Team | null) => void;
  createTeam: (teamData: CreateTeamRequest) => Promise<Team | null>;
  inviteTeamMember: (inviteData: InviteTeamMemberRequest) => Promise<boolean>;
  acceptInvitation: (token: string) => Promise<boolean>;
  removeTeamMember: (userId: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: string, permissions: string[]) => Promise<boolean>;
  createWorkspace: (workspaceData: CreateWorkspaceRequest) => Promise<SharedWorkspace | null>;
  refreshTeams: () => Promise<void>;
  refreshTeamData: () => Promise<void>;
}

export function useTeamCollaboration(): UseTeamCollaborationReturn {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [userInvitations, setUserInvitations] = useState<TeamInvitation[]>([]);
  const [teamWorkspaces, setTeamWorkspaces] = useState<SharedWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
    loadUserInvitations();
  }, []);

  // Load team-specific data when selectedTeam changes
  useEffect(() => {
    if (selectedTeam) {
      loadTeamData(selectedTeam.id);
    } else {
      setTeamMembers([]);
      setTeamInvitations([]);
      setTeamWorkspaces([]);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const userTeams = await teamCollaborationService.getUserTeams();
      setTeams(userTeams);
      
      // Auto-select first team if none selected
      if (!selectedTeam && userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInvitations = async () => {
    try {
      const invitations = await teamCollaborationService.getUserInvitations();
      setUserInvitations(invitations);
    } catch (error) {
      console.error('Error loading user invitations:', error);
    }
  };

  const loadTeamData = async (teamId: string) => {
    try {
      const [members, invitations, workspaces] = await Promise.all([
        teamCollaborationService.getTeamMembers(teamId),
        teamCollaborationService.getTeamInvitations(teamId),
        teamCollaborationService.getTeamWorkspaces(teamId)
      ]);
      
      setTeamMembers(members);
      setTeamInvitations(invitations);
      setTeamWorkspaces(workspaces);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    }
  };

  const selectTeam = (team: Team | null) => {
    setSelectedTeam(team);
  };

  const createTeam = async (teamData: CreateTeamRequest): Promise<Team | null> => {
    try {
      const newTeam = await teamCollaborationService.createTeam(teamData);
      if (newTeam) {
        setTeams(prev => [newTeam, ...prev]);
        setSelectedTeam(newTeam);
        toast.success('Team created successfully');
      }
      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
      return null;
    }
  };

  const inviteTeamMember = async (inviteData: InviteTeamMemberRequest): Promise<boolean> => {
    try {
      const invitation = await teamCollaborationService.inviteTeamMember(inviteData);
      if (invitation) {
        setTeamInvitations(prev => [invitation, ...prev]);
        toast.success('Team member invited successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to invite team member');
      return false;
    }
  };

  const acceptInvitation = async (token: string): Promise<boolean> => {
    try {
      const success = await teamCollaborationService.acceptInvitation(token);
      if (success) {
        toast.success('Invitation accepted successfully');
        await loadTeams();
        await loadUserInvitations();
      }
      return success;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      return false;
    }
  };

  const removeTeamMember = async (userId: string): Promise<boolean> => {
    try {
      if (!selectedTeam) return false;
      
      const success = await teamCollaborationService.removeTeamMember(selectedTeam.id, userId);
      if (success) {
        setTeamMembers(prev => prev.filter(member => member.user_id !== userId));
        toast.success('Team member removed successfully');
      }
      return success;
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
  };

  const updateMemberRole = async (userId: string, role: string, permissions: string[]): Promise<boolean> => {
    try {
      if (!selectedTeam) return false;
      
      const success = await teamCollaborationService.updateMemberRole(selectedTeam.id, userId, role, permissions);
      if (success) {
        setTeamMembers(prev => prev.map(member => 
          member.user_id === userId 
            ? { ...member, role, permissions }
            : member
        ));
        toast.success('Member role updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
      return false;
    }
  };

  const createWorkspace = async (workspaceData: CreateWorkspaceRequest): Promise<SharedWorkspace | null> => {
    try {
      const newWorkspace = await teamCollaborationService.createWorkspace(workspaceData);
      if (newWorkspace) {
        setTeamWorkspaces(prev => [newWorkspace, ...prev]);
        toast.success('Workspace created successfully');
      }
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
      return null;
    }
  };

  const refreshTeams = async () => {
    await loadTeams();
  };

  const refreshTeamData = async () => {
    if (selectedTeam) {
      await loadTeamData(selectedTeam.id);
    }
  };

  return {
    teams,
    selectedTeam,
    teamMembers,
    teamInvitations,
    userInvitations,
    teamWorkspaces,
    isLoading,
    selectTeam,
    createTeam,
    inviteTeamMember,
    acceptInvitation,
    removeTeamMember,
    updateMemberRole,
    createWorkspace,
    refreshTeams,
    refreshTeamData
  };
}

// Specific hook for managing team invitations
export function useTeamInvitations() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const userInvitations = await teamCollaborationService.getUserInvitations();
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      const success = await teamCollaborationService.acceptInvitation(token);
      if (success) {
        setInvitations(prev => prev.filter(inv => inv.token !== token));
        toast.success('Invitation accepted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      return false;
    }
  };

  return {
    invitations,
    isLoading,
    loadInvitations,
    acceptInvitation
  };
}