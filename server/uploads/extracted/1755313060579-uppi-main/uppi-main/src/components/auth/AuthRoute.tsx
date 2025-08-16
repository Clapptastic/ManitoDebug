
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth/roles';

interface AuthRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
}

const AuthRoute: React.FC<AuthRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
}) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Don't show loading spinner here - let the layouts handle loading states
  // This prevents flashing between layouts
  
  // If authentication is required and user is not logged in,
  // redirect to login page with return URL
  if (requireAuth && !loading && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is logged in but the page is for non-authenticated users only,
  // redirect to dashboard or home
  if (!requireAuth && !loading && user) {
    return <Navigate to="/" replace />;
  }

  // If role check is required, implement it here
  if (requireAuth && !loading && user && requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(role))
      : hasRole(requiredRole);
      
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthRoute;
