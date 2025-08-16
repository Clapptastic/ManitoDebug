
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthRequiredProps {
  children: ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();

  console.log('AuthRequired: Auth state', { isAuthenticated, loading, initialized });

  // Show loading while checking authentication
  if (loading || !initialized) {
    console.log('AuthRequired: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('AuthRequired: Redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  console.log('AuthRequired: Rendering children');
  // Render children if authenticated
  return <>{children}</>;
};

export default AuthRequired;
