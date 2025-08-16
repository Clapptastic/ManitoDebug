import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting auth callback process');
        
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Try to handle the callback from URL hash
          const { error: hashError } = await supabase.auth.getSession();
          if (hashError) {
            console.error('Hash callback also failed:', hashError);
            navigate('/auth/login', { replace: true });
            return;
          }
        }

        if (data.session) {
          console.log('Auth callback successful, user authenticated:', data.session.user.email);
          navigate('/', { replace: true });
        } else {
          console.log('No session found, redirecting to login');
          navigate('/auth/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    // Add a small delay to ensure URL is processed
    setTimeout(handleAuthCallback, 100);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;