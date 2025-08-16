
import { UserRole } from '@/types/auth/roles';

export interface AuthContextDefaults {
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
}

export const defaultAuthContext: AuthContextDefaults = {
  signOut: async () => {},
  resetPassword: async () => ({ success: false, error: new Error('Password reset functionality not available') })
};
