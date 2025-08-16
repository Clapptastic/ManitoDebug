/**
 * React Error Boundary with comprehensive logging
 * Catches React component errors and provides fallback UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/services/logging';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;
    
    // Log comprehensive error details
    logger.fatal('React Component Error Boundary Triggered', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      props: this.props,
      state: this.state
    });

    // Call optional onError handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
      errorId
    });
  }

  private handleRetry = () => {
    logger.info('Error Boundary Retry Attempted', {
      errorId: this.state.errorId,
      route: window.location.pathname
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReload = () => {
    logger.info('Error Boundary Page Reload', {
      errorId: this.state.errorId,
      route: window.location.pathname
    });

    window.location.reload();
  };

  private copyErrorDetails = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      logger.info('Error details copied to clipboard', { errorId: this.state.errorId });
    } catch (err) {
      logger.warn('Failed to copy error details', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with comprehensive information
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full space-y-6 text-center">
            <div className="space-y-3">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. The error has been logged and our team will investigate.
              </p>
            </div>

            {/* Error ID for support */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-mono text-muted-foreground">
                Error ID: {this.state.errorId}
              </p>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h3 className="font-semibold text-destructive mb-2">Development Error Details:</h3>
                <pre className="text-xs overflow-auto whitespace-pre-wrap text-destructive">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\nStack Trace:\n${this.state.error.stack}`}
                  {this.state.errorInfo?.componentStack && `\n\nComponent Stack:${this.state.errorInfo.componentStack}`}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.copyErrorDetails} variant="secondary" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy Error Details
              </Button>
            </div>

            {/* Support information */}
            <div className="text-sm text-muted-foreground">
              <p>If this problem persists, please contact support with the error ID above.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;