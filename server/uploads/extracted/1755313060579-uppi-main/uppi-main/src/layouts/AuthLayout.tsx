
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Entrepreneur AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
