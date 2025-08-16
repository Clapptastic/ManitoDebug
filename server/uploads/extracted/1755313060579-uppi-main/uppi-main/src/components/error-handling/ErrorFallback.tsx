import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  errorInfo?: React.ErrorInfo;
  context?: any;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorInfo,
  context
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.log('Error Report:', errorReport);
    
    // Here you could send to an error reporting service
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred while loading this component
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p className="text-sm font-medium text-destructive mb-1">Error Message:</p>
              <code className="text-xs text-destructive/80 break-all">
                {error.message}
              </code>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReportError}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Copy Error Report
            </Button>
          </div>

          {showDetails && error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Error Details</Badge>
              </div>
              
              <div className="p-3 bg-muted/50 rounded border">
                <p className="text-xs font-medium mb-2">Stack Trace:</p>
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </div>

              {errorInfo?.componentStack && (
                <div className="p-3 bg-muted/50 rounded border">
                  <p className="text-xs font-medium mb-2">Component Stack:</p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {context && (
                <div className="p-3 bg-muted/50 rounded border">
                  <p className="text-xs font-medium mb-2">Context:</p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>If this problem persists, please:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Clear your browser cache and cookies</li>
              <li>Try using a different browser</li>
              <li>Check your internet connection</li>
              <li>Contact support with the error details above</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple error boundary wrapper component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    context?: any;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error handling service
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for easy error boundary usage
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}