
import { useAuthContext } from '@/hooks/auth/useAuthContext';

/**
 * @deprecated Use useAuthContext() directly instead
 * This hook is kept for backward compatibility
 */
export const useAdminAuth = () => {
  const auth = useAuthContext();
  
  return {
    user: auth.user,
    loading: auth.loading || auth.roleLoading,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin,
    hasSpecialAccess: auth.hasSpecialAccess
  };
};
