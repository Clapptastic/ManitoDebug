import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorTracker } from '@/utils/errorTracker';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'component' | 'page' | 'app';
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

/**
 * Enhanced Error Boundary with automatic recovery and improved UX
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substring(7)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.level || 'component'}ErrorBoundary] Error caught:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Track error in global error tracker
    errorTracker.trackError(error, `ErrorBoundary-${this.props.level || 'component'}`);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for component-level errors (but not app-level)
    if (this.props.level === 'component' && this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.resetTimeoutId = setTimeout(() => {
        console.log(`Auto-retry attempt ${this.retryCount} for component error`);
        this.handleReset();
      }, 1000 * this.retryCount); // Exponential backoff
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error boundary if resetKeys change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        this.handleReset();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReport = () => {
    const { error, errorInfo } = this.state;
    if (error) {
      // Create detailed error report
      const report = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        level: this.props.level || 'component'
      };
      
      console.log('Error Report:', report);
      // Here you could send to an error reporting service
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const { error, errorId } = this.state;
      const isAppLevel = level === 'app';

      return (
        <div className={`flex items-center justify-center p-4 ${isAppLevel ? 'min-h-screen' : 'min-h-[200px]'}`}>
          <Card className={`w-full ${isAppLevel ? 'max-w-2xl' : 'max-w-lg'}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                {isAppLevel ? 'Application Error' : 'Component Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2">Error Details:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {error?.message || 'Unknown error occurred'}
                </p>
                {errorId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {errorId}
                  </p>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && error?.stack && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="font-semibold text-sm cursor-pointer">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                {level === 'component' && (
                  <Button 
                    onClick={this.handleReload}
                    variant="secondary"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}
                
                {isAppLevel && (
                  <Button 
                    onClick={this.handleReload}
                    variant="default"
                  >
                    Reload Application
                  </Button>
                )}

                <Button 
                  onClick={this.handleReport}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {isAppLevel 
                  ? 'If this error persists, please contact support.'
                  : 'This component encountered an error. You can continue using other parts of the application.'
                }
              </p>
              
              {this.retryCount > 0 && this.retryCount < this.maxRetries && (
                <p className="text-center text-xs text-muted-foreground">
                  Auto-retry attempt {this.retryCount} of {this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;