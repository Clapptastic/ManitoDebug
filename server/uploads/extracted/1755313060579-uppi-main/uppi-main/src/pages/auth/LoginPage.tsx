
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/login/LoginForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { formatErrorMessage } from '@/utils/errorFormatter';
import { authDebugger } from '@/utils/debugging/auth-debugger';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const { isAuthenticated, error, initialized } = useAuth();
  const navigate = useNavigate();

  // Extract connection error message safely
  const connectionError = error ? formatErrorMessage(error) : null;

  // Log when this component renders
  useEffect(() => {
    console.log('[LoginPage] Component rendered, auth state:', {
      isAuthenticated,
      initialized,
      redirectInProgress,
      hasError: !!error
    });
    authDebugger.logAuthEvent('LoginPage rendering, auth state: ' + 
      `isAuthenticated=${isAuthenticated}, initialized=${initialized}`, isAuthenticated);
  }, [isAuthenticated, initialized, redirectInProgress, error]);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('[LoginPage] Auth effect triggered:', {
      isAuthenticated,
      initialized,
      redirectInProgress
    });
    
    if (isAuthenticated && initialized && !redirectInProgress) {
      console.log('[LoginPage] Starting redirect to dashboard');
      authDebugger.logAuthEvent('LoginPage: User is already authenticated, redirecting to dashboard', true);
      setRedirectInProgress(true);
      // Use setTimeout to ensure state update completes before navigation
      setTimeout(() => {
        console.log('[LoginPage] Executing navigation to dashboard');
        navigate('/dashboard', { replace: true });
      }, 10);
    }
  }, [isAuthenticated, navigate, initialized, redirectInProgress]);

  // Don't render anything if redirect is in progress to prevent flashing
  if (redirectInProgress) {
    return (
      <div className="container mx-auto flex h-screen items-center justify-center px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Login to access your account</p>
        </div>
        
        {connectionError && (
          <Alert className="bg-amber-50 text-amber-800 border-amber-300">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Connection Issue Detected</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <p>We're having trouble connecting to our authentication service.</p>
              <p>Please check your internet connection or try again later.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials below to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm 
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-primary font-medium underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By logging in, you agree to our{' '}
            <Link to="/terms" className="hover:text-primary underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="hover:text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
