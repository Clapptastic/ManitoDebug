import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface AdminErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const AdminErrorFallback: React.FC<AdminErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const navigate = useNavigate();

  console.error('Admin Panel Error:', error);
  console.error('Error stack:', error.stack);
  console.error('Component stack:', error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Admin Panel Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Something went wrong in the admin panel. This has been logged for investigation.
          </p>
          
          <details className="text-xs bg-muted p-3 rounded border">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details
            </summary>
            <pre className="whitespace-pre-wrap break-words overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\nStack Trace:\n${error.stack}`}
            </pre>
          </details>
          
          <div className="flex gap-3">
            <Button 
              onClick={resetErrorBoundary}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
}

export const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={AdminErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Admin Panel crashed:', error, errorInfo);
        console.error('Detailed error info:', error.stack);
        console.error('Component stack:', errorInfo.componentStack);
        
        // Report to monitoring service if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'exception', {
            description: `Admin Panel: ${error.message}`,
            fatal: true
          });
        }
      }}
      onReset={() => {
        // Clear any problematic state
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};