import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/hooks/auth/useAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types/auth/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requiredRole,
  fallbackPath = '/auth/login'
}) => {
  const { loading, isAdmin, isSuperAdmin, isAuthenticated, hasRole } = useAuthContext();
  const location = useLocation();

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              {requiredRole} privileges required to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Contact your system administrator if you need access to this feature.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check super admin access
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Super Admin privileges required to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Contact your system administrator if you need access to this feature.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check admin access
  if (requireAdmin && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-warning" />
            </div>
            <CardTitle className="text-warning">Admin Access Required</CardTitle>
            <CardDescription>
              Administrator privileges required to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please contact your administrator if you need access to this feature.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="text-primary hover:underline"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};