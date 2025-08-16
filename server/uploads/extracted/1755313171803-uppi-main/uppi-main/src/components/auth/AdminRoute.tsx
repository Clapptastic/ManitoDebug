import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth/roles';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
  superAdminOnly?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredRole = UserRole.ADMIN,
  fallbackPath = '/auth',
  superAdminOnly = false
}) => {
  const { user, loading, isAuthenticated, userRoles, isSuperAdmin, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check permissions based on the auth context roles
  let hasAccess = false;
  
  if (superAdminOnly) {
    hasAccess = isSuperAdmin;
  } else {
    switch (requiredRole) {
      case UserRole.SUPER_ADMIN:
        hasAccess = isSuperAdmin;
        break;
      case UserRole.ADMIN:
        hasAccess = isAdmin || isSuperAdmin;
        break;
      case UserRole.USER:
      default:
        hasAccess = userRoles.length > 0;
        break;
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;