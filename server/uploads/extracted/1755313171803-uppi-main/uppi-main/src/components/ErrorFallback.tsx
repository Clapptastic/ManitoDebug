
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <div className="mt-2 text-sm">
            <p className="font-medium">{error.toString()}</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2 whitespace-pre-wrap text-xs">
                <summary>Error stack</summary>
                {error.stack}
              </details>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={resetErrorBoundary}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button 
              variant="default" 
              asChild
            >
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go to home
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorFallback;
