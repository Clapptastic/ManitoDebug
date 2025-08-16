import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  settings: Json;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  permissions: Json;
  joined_at: string;
  invited_by?: string;
  status: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
  status: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  permissions?: Json;
}

export interface SharedWorkspace {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  workspace_type: string;
  settings: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  subscription_tier?: string;
}

export interface InviteTeamMemberRequest {
  team_id: string;
  email: string;
  role?: string;
}

export interface CreateWorkspaceRequest {
  team_id: string;
  name: string;
  description?: string;
  workspace_type?: string;
}

export class TeamCollaborationService {
  /**
   * Get user's teams (owned or member of)
   */
  async getUserTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members!inner(user_id, role, status)
        `)
        .eq('team_members.status', 'active');

      if (error) throw error;
      
      // Clean up the returned data to match Team interface
      const teams = (data || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        owner_id: team.owner_id,
        settings: team.settings,
        subscription_tier: team.subscription_tier,
        created_at: team.created_at,
        updated_at: team.updated_at
      }));
      
      return teams;
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  /**
   * Create a new team
   */
  async createTeam(teamData: CreateTeamRequest): Promise<Team | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          owner_id: user.id,
          subscription_tier: teamData.subscription_tier || 'free'
        })
        .select()
        .single();

      if (error) throw error;

      // Add the owner as a team member
      await supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: user.id,
          role: 'owner',
          permissions: ['read', 'write', 'admin'],
          status: 'active'
        });

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  /**
   * Invite a team member
   */
  async inviteTeamMember(inviteData: InviteTeamMemberRequest): Promise<TeamInvitation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate invitation token
      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: inviteData.team_id,
          email: inviteData.email,
          role: inviteData.role || 'member',
          invited_by: user.id,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error inviting team member:', error);
      return null;
    }
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if the email matches the current user
      if (invitation.email !== user.email) {
        throw new Error('Invitation email does not match current user');
      }

      // Add user to team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: invitation.role,
          permissions: ['read'],
          invited_by: invitation.invited_by,
          status: 'active'
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  }

  /**
   * Get team invitations
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team invitations:', error);
      return [];
    }
  }

  /**
   * Get user's pending invitations
   */
  async getUserInvitations(): Promise<TeamInvitation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams(name)
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user invitations:', error);
      return [];
    }
  }

  /**
   * Create shared workspace
   */
  async createWorkspace(workspaceData: CreateWorkspaceRequest): Promise<SharedWorkspace | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('shared_workspaces')
        .insert({
          team_id: workspaceData.team_id,
          name: workspaceData.name,
          description: workspaceData.description,
          workspace_type: workspaceData.workspace_type || 'general',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  }

  /**
   * Get team workspaces
   */
  async getTeamWorkspaces(teamId: string): Promise<SharedWorkspace[]> {
    try {
      const { data, error } = await supabase
        .from('shared_workspaces')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team workspaces:', error);
      return [];
    }
  }

  /**
   * Remove team member
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed' })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  }

  /**
   * Update team member role
   */
  async updateMemberRole(teamId: string, userId: string, role: string, permissions: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role, permissions })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }
}

export const teamCollaborationService = new TeamCollaborationService();