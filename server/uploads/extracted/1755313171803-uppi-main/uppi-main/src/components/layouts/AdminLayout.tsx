
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import { AdminErrorBoundary } from './AdminErrorBoundary';
// import DevToolsModule from '@/components/dev/DevToolsModule';
import { useAuthContext } from '@/hooks/auth/useAuthContext';
import { UserRole } from '@/types/auth/roles';

const AdminLayout = () => {
  // Get user role from auth context
  const { userRoles, isSuperAdmin, isAdmin, loading, isAuthenticated, signOut } = useAuthContext();
  const userRole = userRoles[0] || (isSuperAdmin ? UserRole.SUPER_ADMIN : (isAdmin ? UserRole.ADMIN : UserRole.USER));

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Block access for non-super admins
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <ShieldX className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="font-semibold mb-2">Access Denied</div>
              <div className="text-sm">
                Super Admin privileges are required to access the admin panel.
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
            <Button 
              onClick={signOut} 
              variant="default"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <AdminErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar 
            isOpen={true}
            isMobile={false}
            toggleSidebar={() => {}} 
            userRole={userRole}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-14 items-center border-b border-border px-4 lg:px-6 bg-card/50 backdrop-blur-sm">
              <SidebarTrigger className="mr-4 hover:bg-accent hover:text-accent-foreground transition-colors" />
              <AdminHeader />
            </header>
            <main className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in"
                     style={{ animationDelay: '100ms' }}>
                  <AdminErrorBoundary>
                    <Outlet />
                  </AdminErrorBoundary>
                </div>
              </ScrollArea>
            </main>
          </div>
        </div>
        <Toaster />
        {/* <DevToolsModule /> */}
      </SidebarProvider>
    </AdminErrorBoundary>
  );
};

export default AdminLayout;
