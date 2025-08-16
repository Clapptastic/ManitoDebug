import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  user_metadata: any;
  app_metadata: any;
  last_active_at: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  metadata: any;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  metadata?: any;
}

export interface UpdateUserRequest {
  full_name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive' | 'suspended';
  metadata?: any;
}

class UserManagementService {
  /**
   * Fetch all users with their profiles and roles
   */
  async fetchUsers(): Promise<User[]> {
    try {
      // Use edge function for admin operations
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const response = await fetch(`https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/user-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list_users' })
      });

      if (!response.ok) {
        // Fallback to profiles table if edge function is not available
        return this.fetchUsersFromProfiles();
      }

      const result = await response.json();
      return result.users || [];
    } catch (error) {
      console.error('Error fetching users from edge function, falling back to profiles:', error);
      return this.fetchUsersFromProfiles();
    }
  }

  /**
   * Fallback method to fetch users from profiles table
   */
  private async fetchUsersFromProfiles(): Promise<User[]> {
    try {
      // Get user profiles (this doesn't require admin API)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Transform the data to match our interface
      const users: User[] = (profiles || []).map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.user_id);
        const role = userRole?.role || profile.role || 'user';
        const validRole = ['user', 'admin', 'super_admin'].includes(role) ? role as 'user' | 'admin' | 'super_admin' : 'user';
        
        return {
          id: profile.user_id || profile.id,
          email: profile.email || 'Unknown Email',
          full_name: profile.full_name || null,
          avatar_url: profile.avatar_url || null,
          role: validRole,
          status: profile.role === 'suspended' ? 'suspended' : 'active',
          created_at: profile.created_at || new Date().toISOString(),
          last_sign_in_at: null, // Not available without admin API
          email_confirmed_at: null, // Not available without admin API
          phone: null,
          user_metadata: {},
          app_metadata: {},
          last_active_at: profile.last_active_at || profile.updated_at,
        };
      });

      return users;
    } catch (error) {
      console.error('Error fetching users from profiles:', error);
      throw error;
    }
  }

  /**
   * Create a new user (simplified version for client-side)
   */
  async createUser(userData: CreateUserRequest): Promise<void> {
    try {
      // For now, we'll create a profile entry and handle auth user creation server-side
      // This is a placeholder - in production you'd want to use an edge function for this
      throw new Error('User creation requires server-side implementation. Please contact an administrator.');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user information (simplified version)
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<void> {
    try {
      // Update profile
      const profileUpdates: any = {};
      if (userData.full_name !== undefined) profileUpdates.full_name = userData.full_name;
      if (userData.role !== undefined) profileUpdates.role = userData.role;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      // Update user role if specified
      if (userData.role) {
        // Get current user for assigned_by
        const { data: { user } } = await supabase.auth.getUser();
        
        // Deactivate existing roles
        await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', userId);

        // Create new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userData.role,
            assigned_by: user?.id,
            is_active: true
          });

        if (roleError) throw roleError;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const response = await fetch(`https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/user-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'suspend_user', userId })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Delete user permanently
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const response = await fetch(`https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1/user-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete_user', userId })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Get user roles history
   */
  async getUserRoleHistory(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user role history:', error);
      throw error;
    }
  }

  /**
   * Determine user status based on auth data
   */
  private determineUserStatus(authUser: any): 'active' | 'inactive' | 'suspended' {
    if (authUser.app_metadata?.suspended) return 'suspended';
    if (!authUser.email_confirmed_at) return 'inactive';
    return 'active';
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const users = await this.fetchUsers();
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
      const newThisMonth = users.filter(u => 
        new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;
      const suspendedUsers = users.filter(u => u.status === 'suspended').length;

      return {
        totalUsers,
        activeUsers,
        adminUsers,
        newThisMonth,
        suspendedUsers,
        inactiveUsers: users.filter(u => u.status === 'inactive').length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();