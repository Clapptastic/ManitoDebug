import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  hasError: boolean;
}

const DefaultErrorFallback = memo<ErrorBoundaryFallbackProps>(({ error, resetError }) => (
  <Card className="border-red-200 bg-red-50">
    <CardHeader>
      <CardTitle className="text-red-800 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Something went wrong
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
      </Alert>
      <Button 
        onClick={resetError}
        variant="outline"
        className="w-full"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </CardContent>
  </Card>
));

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Here you would typically send to an error monitoring service
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetKeys !== prevProps.resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError && error) {
      const FallbackComponent = Fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={error}
          resetError={this.resetError}
          hasError={hasError}
        />
      );
    }

    return children;
  }
}

/**
 * Higher-order component for adding error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setError(errorObj);
    
    // Log the error
    console.error('useErrorHandler caught error:', errorObj);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return {
    handleError,
    resetError,
    hasError: !!error
  };
}

export default ErrorBoundary;