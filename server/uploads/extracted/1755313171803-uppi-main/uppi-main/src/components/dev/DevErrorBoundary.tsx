import React, { Component, ReactNode } from 'react';
import { ErrorCapture } from './ErrorCapture';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class DevErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('DevErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleCloseError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error && import.meta.env.DEV) {
      return (
        <ErrorCapture
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          componentStack={this.state.errorInfo?.componentStack}
          onClose={this.handleCloseError}
        />
      );
    }

    return this.props.children;
  }
}