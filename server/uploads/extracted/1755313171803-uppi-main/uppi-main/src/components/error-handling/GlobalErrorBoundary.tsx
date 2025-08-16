import React, { Component, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { errorHandler } from '@/services/error-handling/ErrorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary for the entire application
 * Catches unhandled errors and provides fallback UI
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to our centralized error handling service
    errorHandler.logError(error, {
      component: 'GlobalErrorBoundary',
      action: 'unhandled_component_error',
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}