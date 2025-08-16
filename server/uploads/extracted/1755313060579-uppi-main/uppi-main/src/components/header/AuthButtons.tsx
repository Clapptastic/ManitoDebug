
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { defaultAuthContext } from '@/components/auth/types';

const AuthButtons = () => {
  const { user, isAuthenticated, signOut = defaultAuthContext.signOut } = useAuth();
  
  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link to="/settings/profile">
              {user?.email || 'Account'}
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => await signOut()}
          >
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link to="/auth/login">
              Log In
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="sm"
            asChild
          >
            <Link to="/auth/signup">
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};

export default AuthButtons;
