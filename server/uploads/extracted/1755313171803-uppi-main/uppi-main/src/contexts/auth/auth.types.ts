
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth/roles';

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  initialized: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signUp: (credentials: { email: string; password: string; fullName?: string }) => Promise<{ success: boolean; data: any | null; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
  hasRole?: (role: UserRole | UserRole[]) => boolean;
  hasSpecialAccess?: boolean;
}

/**
 * Default auth context for initial state
 */
export const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  initialized: false,
  signIn: async () => ({ success: false, data: null, error: new Error('Auth provider not initialized') }),
  signUp: async () => ({ success: false, data: null, error: new Error('Auth provider not initialized') }),
  signOut: async () => { console.error('Auth provider not initialized'); },
  resetPassword: async () => ({ success: false, error: new Error('Auth provider not initialized') }),
  hasRole: () => false,
  hasSpecialAccess: false
};
