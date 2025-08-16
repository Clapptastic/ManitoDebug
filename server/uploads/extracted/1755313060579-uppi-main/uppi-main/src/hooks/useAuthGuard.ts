import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const useAuthGuard = (requiredRole?: string) => {
  const { user } = useAuth();
  const authLoading = false; // Simplified for now
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth/login');
        return;
      }
    }
  }, [user, authLoading, navigate]);

  return {
    user,
    profile: null,
    isLoading: authLoading,
    isAuthenticated: !!user,
    hasRequiredRole: true // Simplified for now
  };
};