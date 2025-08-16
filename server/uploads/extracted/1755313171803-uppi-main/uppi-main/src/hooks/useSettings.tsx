
import { useState, useCallback } from 'react';

/**
 * Hook for managing global settings
 */
export const useSettings = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);
  
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);
  
  return {
    isSettingsOpen,
    openSettings,
    closeSettings
  };
};
