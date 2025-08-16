/**
 * Enhanced Error Boundary with User Feedback
 * Provides comprehensive error catching and user-friendly error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { handleError } from '@/utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundaryWithFeedback extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error with context
    handleError(error, {
      action: 'Component Error Boundary',
      component: this.constructor.name,
      metadata: {
        errorInfo,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Report to error monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This could be extended to send to external monitoring services
    console.error('Error Boundary caught an error:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  private handleGoHome = () => {
    // Use window.location.reload to restart the app properly
    window.location.reload();
  };

  private handleReportBug = () => {
    const error = this.state.error;
    const errorInfo = this.state.errorInfo;
    
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard for easy bug reporting
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2)).then(() => {
      alert('Error details copied to clipboard. Please paste this when reporting the bug.');
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <span>Something went wrong</span>
              </CardTitle>
              <CardDescription>
                An unexpected error occurred while loading this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  We're sorry for the inconvenience. The error has been automatically reported to our team.
                </AlertDescription>
              </Alert>

              {this.props.showDetails && this.state.error && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error Details:</strong>
                    <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                      {this.state.error.message}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {this.state.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again ({this.maxRetries - this.state.retryCount} attempts left)</span>
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>
                
                <Button variant="secondary" onClick={this.handleReportBug} className="flex items-center space-x-2">
                  <Bug className="h-4 w-4" />
                  <span>Report Bug</span>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                If this problem persists, please contact support with the error details above.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundaryWithFeedback fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundaryWithFeedback>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}