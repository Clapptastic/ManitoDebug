/**
 * AuthManager - Unified Authentication Service
 * Single source of truth for all authentication operations
 */

import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/core/unified';

export interface AuthOperations {
  // Session Management
  getSession(): Promise<{ session: Session | null; user: User | null; error: Error | null }>;
  refreshSession(): Promise<{ success: boolean; error: Error | null }>;
  
  // Authentication Operations
  signIn(email: string, password: string): Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signUp(email: string, password: string, metadata?: Record<string, any>): Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signOut(): Promise<{ success: boolean; error: Error | null }>;
  resetPassword(email: string): Promise<{ success: boolean; error: Error | null }>;
  updatePassword(password: string): Promise<{ success: boolean; error: Error | null }>;
  
  // Authorization Operations
  hasRole(requiredRole: UserRole | UserRole[]): boolean;
  hasSpecialAccess(): boolean;
  checkPermissions(permission: string): boolean;
  
  // Event Subscription
  subscribeToAuthChanges(callback: (event: string, session: Session | null) => void): () => void;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  userRoles: string[];
}

class AuthManager implements AuthOperations {
  private subscribers: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true,
    initialized: false,
    error: null,
    isAuthenticated: false,
    userRoles: []
  };
  // Prevent duplicate subscriptions (HMR/StrictMode safe)
  private initialized = false;
  private authUnsubscribe?: () => void;
  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (this.initialized) return;
      this.initialized = true;
      // Set up auth state listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        this.updateState({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false,
          initialized: true,
          error: null
        });

        // Fetch user roles if user exists
        if (session?.user) {
          this.fetchUserRoles(session.user.id);
        } else {
          this.updateState({ userRoles: [] });
        }
      });
      this.authUnsubscribe = () => subscription.unsubscribe();

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.updateState({
          error,
          loading: false,
          initialized: true
        });
        return;
      }

      this.updateState({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
        initialized: true,
        error: null
      });

      if (session?.user) {
        await this.fetchUserRoles(session.user.id);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({
        error: error as Error,
        loading: false,
        initialized: true
      });
    }
  }

  private async fetchUserRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const roles = data?.map(r => r.role) || [];
      this.updateState({ userRoles: roles });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      this.updateState({ userRoles: [] });
    }
  }

  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('Error in auth state subscriber:', error);
      }
    });
  }

  // Public API
  getState(): AuthState {
    return { ...this.currentState };
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async getSession(): Promise<{ session: Session | null; user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return {
        session: data.session,
        user: data.session?.user || null,
        error
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: error as Error
      };
    }
  }

  async refreshSession(): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.auth.refreshSession();
      return { success: !error, error };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; data: any | null; error: Error | null }> {
    try {
      this.updateState({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      const success = !error && !!data.user;
      
      if (error) {
        this.updateState({ loading: false, error });
      }

      return { success, data, error };
    } catch (error) {
      const authError = error as Error;
      this.updateState({ loading: false, error: authError });
      return { success: false, data: null, error: authError };
    }
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<{ success: boolean; data: any | null; error: Error | null }> {
    try {
      this.updateState({ loading: true, error: null });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      const success = !error && !!data.user;
      
      if (error) {
        this.updateState({ loading: false, error });
      }

      return { success, data, error };
    } catch (error) {
      const authError = error as Error;
      this.updateState({ loading: false, error: authError });
      return { success: false, data: null, error: authError };
    }
  }

  async signOut(): Promise<{ success: boolean; error: Error | null }> {
    try {
      this.updateState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        this.updateState({
          user: null,
          session: null,
          isAuthenticated: false,
          userRoles: [],
          loading: false,
          error: null
        });
      } else {
        this.updateState({ loading: false, error });
      }

      return { success: !error, error };
    } catch (error) {
      const authError = error as Error;
      this.updateState({ loading: false, error: authError });
      return { success: false, error: authError };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      return { success: !error, error };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async updatePassword(password: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      return { success: !error, error };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  hasRole(requiredRole: UserRole | UserRole[]): boolean {
    const { user, userRoles } = this.currentState;
    
    if (!user) return false;

    // Special access for specific email
    if (user.email === 'akclapp@gmail.com') return true;

    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => userRoles.includes(role as string));
    }
    
    return userRoles.includes(requiredRole as string);
  }

  hasSpecialAccess(): boolean {
    const { user } = this.currentState;
    return user?.email === 'akclapp@gmail.com' || 
           this.hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  }

  checkPermissions(permission: string): boolean {
    // Implementation for future permission-based access control
    return this.hasSpecialAccess();
  }

  subscribeToAuthChanges(callback: (event: string, session: Session | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }

  // Cleanup method
  destroy() {
    this.subscribers = [];
    if (this.authUnsubscribe) {
      try { this.authUnsubscribe(); } catch {}
      this.authUnsubscribe = undefined;
    }
    this.initialized = false;
  }
}

// Export singleton instance (HMR safe)
const g = globalThis as any;
if (!g.__APP_AUTH_MANAGER__) {
  g.__APP_AUTH_MANAGER__ = new AuthManager();
}
export const authManager = g.__APP_AUTH_MANAGER__;
export { AuthManager };
export default authManager;