
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { GlobalErrorBoundary } from '@/components/error-handling/GlobalErrorBoundary';
import { errorHandler } from '@/services/error-handling/ErrorHandlingService';
import { initializeCSRF } from '@/utils/security/csrfProtection';
import App from './App';
import './index.css';

// Initialize global error monitoring
errorHandler.initialize();

// Initialize CSRF protection
initializeCSRF();

// Create the root element
const rootElement = document.getElementById('root');

// Make sure the root element exists
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create the root react instance
const root = ReactDOM.createRoot(rootElement);

// Render the app with GlobalErrorBoundary for production-ready error handling
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
