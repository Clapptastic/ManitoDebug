import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Enhanced Error Boundary for Admin Components
 * Provides proper error handling and reporting for admin functionality
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AdminErrorBoundary] Component error caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    this.logError(error, errorInfo);
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log error to centralized tracker (edge function) via monitoring service
      await errorMonitoringService.logCriticalError(error, 'AdminErrorBoundary', 'Component Error', {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'AdminErrorBoundary'
      });
    } catch (logError) {
      console.error('[AdminErrorBoundary] Failed to log error:', logError);
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">
                Admin Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2">Error Details:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="font-semibold text-sm cursor-pointer">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="default"
                >
                  Reload Page
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                If this error persists, please contact your system administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;