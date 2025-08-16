import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  subscription_tier: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions: any;
  joined_at: string;
  invited_at: string;
  invited_by?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  permissions: any;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

class TeamService {
  async createTeam(teamData: {
    name: string;
    description?: string;
    subscription_tier?: string;
  }): Promise<Team> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description,
        owner_id: user.id,
        subscription_tier: teamData.subscription_tier || 'team_basic'
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add owner as first team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      });

    if (memberError) throw memberError;
    return team;
  }

  async getUserTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(*)
      `)
      .eq('team_members.user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('team_members.status', 'active');

    if (error) throw error;
    return data || [];
  }

  async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  }

  async inviteTeamMember(teamId: string, email: string, role: string = 'member'): Promise<TeamInvitation> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async acceptInvitation(token: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('email', user.email)
      .single();

    if (inviteError || !invitation) throw new Error('Invalid invitation');

    // Check if not expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Add team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by
      });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) throw updateError;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const teamService = new TeamService();