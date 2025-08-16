
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatErrorMessage } from '@/utils/errorFormatter';

interface AuthStatusProps {
  showEmail?: boolean;
  showStatus?: boolean;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ 
  showEmail = true, 
  showStatus = true 
}) => {
  const { user, error, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading auth status...</div>;
  }

  if (!isAuthenticated && !error) {
    return (
      <div className="text-sm text-muted-foreground">
        Not authenticated
      </div>
    );
  }

  // Safely handle error display using the formatter
  const errorMessage = error ? formatErrorMessage(error) : null;

  return (
    <div className="space-y-2">
      {showStatus && (
        <div className="text-sm">
          Authentication status: {isAuthenticated ? (
            <span className="text-green-500 font-medium">Authenticated</span>
          ) : (
            <span className="text-red-500 font-medium">Not authenticated</span>
          )}
        </div>
      )}
      
      {showEmail && user && (
        <div className="text-sm">
          User: <span className="font-medium">{user.email}</span>
        </div>
      )}
      
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AuthStatus;
