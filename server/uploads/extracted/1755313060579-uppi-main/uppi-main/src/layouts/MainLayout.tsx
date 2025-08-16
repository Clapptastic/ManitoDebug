
import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layouts/Navbar';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/loading-spinner';

const MainLayout: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <Outlet />
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Entrepreneur AI Platform. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              to="/terms"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
