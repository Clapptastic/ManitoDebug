/**
 * Auth Callback Page
 * Handles authentication callbacks from email confirmations and OAuth providers
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting auth callback process');
        
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        if (data.session) {
          console.log('Auth callback successful, user authenticated:', data.session.user.email);
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          console.log('No session found, checking URL parameters');
          
          // Check for specific error parameters
          const errorDescription = searchParams.get('error_description');
          const error = searchParams.get('error');
          
          if (error || errorDescription) {
            setStatus('error');
            setMessage(errorDescription || error || 'Authentication failed');
          } else {
            setStatus('error');
            setMessage('No authentication session found');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
      }
    };

    // Add a small delay to ensure URL is processed
    const timeoutId = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/auth/login', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            
            {status === 'loading' && 'Processing Authentication...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-center text-muted-foreground">
              Please wait while we verify your authentication...
            </p>
          )}
          
          {status === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Button onClick={handleRetry} variant="default">
                  Try Again
                </Button>
                <Button onClick={handleGoHome} variant="outline">
                  Go to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallbackPage;