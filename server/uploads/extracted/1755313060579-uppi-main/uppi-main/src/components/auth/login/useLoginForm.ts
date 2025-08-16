
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Fixed import to use consolidated auth
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/utils/errorFormatter';

interface LoginFormState {
  email: string;
  password: string;
  remember: boolean;
}

export const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormState>({
    email: '',
    password: '',
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from || '/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { success, error } = await signIn(formData.email, formData.password);

      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back! You've been successfully logged in.",
        });
        navigate(from, { replace: true });
      } else {
        // Handle login error
        const errorMessage = error && typeof error === 'object' && 'message' in error
          ? getAuthErrorMessage((error as Error).message) 
          : 'Failed to login. Please check your credentials.';
        
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleInputChange,
    handleLogin
  };
};
