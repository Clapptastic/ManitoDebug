
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Process the auth callback and redirect to the appropriate page
    // This is a placeholder for actual auth callback handling
    const processAuth = async () => {
      try {
        // Simulate processing authentication
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirect to dashboard after processing
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login', { replace: true });
      }
    };
    
    processAuth();
  }, [navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <h1 className="text-xl font-medium">Processing your login...</h1>
      <p className="text-muted-foreground">You'll be redirected shortly.</p>
    </div>
  );
};

export default AuthCallback;
