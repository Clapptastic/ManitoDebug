
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundaryWithFeedback } from '@/components/common/ErrorBoundaryWithFeedback';
import { PerformanceMonitor } from '@/components/shared/PerformanceMonitor';
import { DevTools } from '@/components/dev/DevTools';
import { AuthProvider } from '@/providers/AuthProvider';
import AppRoutes from '@/AppRoutes';
import AdminRoutes from './routes/AdminRoutes';
import AuthRoutes from './routes/AuthRoutes';
import AuthRequired from './components/auth/AuthRequired';
import LandingPage from './pages/LandingPage';
import { HelmetProvider } from 'react-helmet-async';
import './App.css';

// Create a client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Reduced from 2 to avoid cascading failures
      retryDelay: 2000,
      // Don't throw errors by default - let components handle gracefully
      throwOnError: false
    },
  },
});

function App() {
  const AppContent = () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider>
          <Router>
            <PerformanceMonitor />
            <ErrorBoundaryWithFeedback 
              showDetails={import.meta.env.DEV}
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-semibold">Something went wrong</h2>
                    <p className="text-muted-foreground">Please refresh the page to try again</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="px-4 py-2 bg-primary text-primary-foreground rounded"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              }
            >
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public landing page */}
                  <Route path="/landing" element={<LandingPage />} />
                  
                  {/* Public auth routes */}
                  <Route path="/auth/*" element={<AuthRoutes />} />
                  
                  {/* Protected admin routes */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <AuthRequired>
                        <AdminRoutes />
                      </AuthRequired>
                    } 
                  />
                  
                  {/* Protected main application routes */}
                  <Route 
                    path="/*" 
                    element={
                      <AuthRequired>
                        <AppRoutes />
                      </AuthRequired>
                    } 
                  />
                </Routes>
              </div>
              <Toaster />
              {import.meta.env.DEV && <DevTools />}
            </ErrorBoundaryWithFeedback>
          </Router>
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  // Return app content directly without outer error boundary
  return <AppContent />;
}

export default App;
