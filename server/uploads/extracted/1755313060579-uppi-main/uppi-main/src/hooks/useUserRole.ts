import { useAuthContext } from '@/hooks/auth/useAuthContext';
import { UserRole } from '@/types/auth/roles';

interface UseUserRoleReturn {
  userRoles: UserRole[];
  loading: boolean;
  error: string | null;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasSpecialAccess: boolean;
  refreshRoles: () => Promise<void>;
}

/**
 * @deprecated Use useAuthContext() directly instead
 * This hook is kept for backward compatibility
 */
export function useUserRole(): UseUserRoleReturn {
  const auth = useAuthContext();

  return {
    userRoles: auth.userRoles,
    loading: auth.loading || auth.roleLoading,
    error: auth.error?.message || null,
    hasRole: auth.hasRole,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin,
    hasSpecialAccess: auth.hasSpecialAccess,
    refreshRoles: auth.refreshRoles
  };
}