
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import ProfileButton from '@/components/auth/ProfileButton';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Entrepreneur AI</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link to="/market-research/competitor-analysis" className="text-sm font-medium transition-colors hover:text-primary">
              Competition
            </Link>
            <Link to="/market-research" className="text-sm font-medium transition-colors hover:text-primary">
              Research
            </Link>
            <Link to="/analytics" className="text-sm font-medium transition-colors hover:text-primary">
              Analytics
            </Link>
            <Link to="/business-tools" className="text-sm font-medium transition-colors hover:text-primary">
              Tools
            </Link>
            <Link to="/chat" className="text-sm font-medium transition-colors hover:text-primary">
              AI Chat
            </Link>
            {user && (
              <Link to="/settings" className="text-sm font-medium transition-colors hover:text-primary">
                Settings
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ProfileButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
