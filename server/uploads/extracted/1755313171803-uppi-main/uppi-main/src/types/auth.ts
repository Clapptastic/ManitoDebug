import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth/roles';

/**
 * Unified authentication state interface
 */
export interface AuthState {
  // Core auth data
  user: User | null;
  session: Session | null;
  
  // Loading states
  loading: boolean;
  initialized: boolean;
  roleLoading: boolean;
  
  // Auth status
  isAuthenticated: boolean;
  
  // Role data
  userRoles: UserRole[];
  
  // Computed role checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasSpecialAccess: boolean;
  
  // Error state
  error: Error | null;
}

/**
 * Authentication operations interface
 */
export interface AuthOperations {
  // Auth operations
  signIn: (email: string, password: string) => Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
  
  // Role operations
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshRoles: () => Promise<void>;
  
  // Session operations
  getSession: () => Promise<Session | null>;
  refreshSession: () => Promise<void>;
}

/**
 * Complete auth context interface
 */
export interface AuthContextType extends AuthState, AuthOperations {}

/**
 * Auth provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}