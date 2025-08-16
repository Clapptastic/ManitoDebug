
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export interface UseNavigationResult {
  goTo: (path: string) => void;
  goBack: () => void;
  currentPath: string;
  isCurrentPath: (path: string) => boolean;
}

export const useNavigation = (): UseNavigationResult => {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = useCallback((path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isCurrentPath = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  return {
    goTo,
    goBack,
    currentPath: location.pathname,
    isCurrentPath
  };
};
