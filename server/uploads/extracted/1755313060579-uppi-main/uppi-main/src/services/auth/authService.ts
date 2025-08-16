/**
 * CONSOLIDATED Authentication Service
 * Single source of truth for all Supabase authentication operations
 * Follows Supabase best practices for session management and token handling
 */

import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth/roles';

export interface AuthServiceResult<T = any> {
  success: boolean;
  data: T | null;
  error: AuthError | Error | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  metadata?: any;
}

/**
 * Authentication Service Class
 * Handles all authentication operations with proper error handling
 */
class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthServiceResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      return {
        success: !error,
        data,
        error,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err as Error,
      };
    }
  }

  /**
   * Sign up with email and password
   * Includes proper redirect URL for email confirmation
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthServiceResult> {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: credentials.fullName,
            ...credentials.metadata,
          },
        },
      });

      return {
        success: !error,
        data,
        error,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err as Error,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthServiceResult<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      return {
        success: !error,
        data: null,
        error,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err as Error,
      };
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<AuthServiceResult<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      return {
        success: !error,
        data: null,
        error,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err as Error,
      };
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<AuthServiceResult<Session>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      return {
        success: !error && !!data.session,
        data: data.session,
        error,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err as Error,
      };
    }
  }

  /**
   * Get user roles from database
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data: roleData, error } = await supabase
        .rpc('get_user_role', { user_id_param: userId });
      
      if (error) {
        console.error('Error fetching user role:', error);
        return [UserRole.USER];
      }

      const roles: UserRole[] = [];
      
      if (roleData) {
        switch (roleData) {
          case 'super_admin':
            roles.push(UserRole.SUPER_ADMIN);
            break;
          case 'admin':
            roles.push(UserRole.ADMIN);
            break;
          default:
            roles.push(UserRole.USER);
            break;
        }
      } else {
        roles.push(UserRole.USER);
      }

      return roles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [UserRole.USER];
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check if user has specific role
   */
  hasRole(userRoles: UserRole[], requiredRole: UserRole | UserRole[]): boolean {
    if (!userRoles.length) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => userRoles.includes(role));
    }
    
    return userRoles.includes(requiredRole);
  }

  /**
   * Validate auth token
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;