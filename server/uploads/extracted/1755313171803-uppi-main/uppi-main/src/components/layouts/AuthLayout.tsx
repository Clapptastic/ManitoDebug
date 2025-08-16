
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

/**
 * Authentication layout for login, register, and other auth pages
 * Redirects authenticated users to dashboard
 */
const AuthLayout: React.FC = () => {
  const { isAuthenticated, loading, initialized } = useAuth();
  
  // Don't redirect during loading or before initialization
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    console.log('AuthLayout: Authenticated user detected, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollArea className="h-full">
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Outlet />
        </main>
      </ScrollArea>
      <Toaster />
    </div>
  );
};

export default AuthLayout;
