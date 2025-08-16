import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import { AuthContextType } from '@/types/auth';

/**
 * Hook to access the unified authentication context
 * This is the single source of truth for all auth and role data
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
};

// Export as default for convenience
export default useAuthContext;