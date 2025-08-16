
import { useAuthContext } from '@/hooks/auth/useAuthContext';
import type { AuthContextType } from '@/types/auth';

/**
 * Enhanced authentication hook with backward compatibility
 * This consolidates all auth functionality and eliminates duplicate hooks
 * while maintaining compatibility with existing components
 */
export function useAuth(): AuthContextType & {
  hasError: boolean;
  redirectInProgress: boolean;
} {
  const authContext = useAuthContext();
  
  // Enhanced auth state with backward compatibility
  return {
    ...authContext,
    hasError: !!authContext.error,
    redirectInProgress: authContext.loading && !authContext.initialized,
  };
}

// Re-export for backward compatibility
export { useAuthContext } from '@/hooks/auth/useAuthContext';
