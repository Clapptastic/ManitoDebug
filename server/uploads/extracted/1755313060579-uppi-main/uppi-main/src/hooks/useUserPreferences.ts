import { useState, useEffect } from 'react';
import { userPreferencesService, UserPreferences, UserPreferencesUpdate } from '@/services/core/userPreferencesService';
import { toast } from 'sonner';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  updatePreferences: (updates: UserPreferencesUpdate) => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const userPrefs = await userPreferencesService.getPreferences();
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast.error('Failed to load user preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: UserPreferencesUpdate): Promise<boolean> => {
    try {
      const updatedPrefs = await userPreferencesService.updatePreferences(updates);
      if (updatedPrefs) {
        setPreferences(updatedPrefs);
        toast.success('Preferences updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  const refreshPreferences = async () => {
    await loadPreferences();
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    refreshPreferences
  };
}

// Specific hooks for individual preference types
export function useLanguagePreference() {
  const { preferences } = useUserPreferences();
  
  const setLanguage = async (language: string) => {
    return await userPreferencesService.updateUIPreferences({ language });
  };

  return {
    language: preferences?.ui_preferences?.language || 'en',
    setLanguage
  };
}

export function useTimezonePreference() {
  const { preferences } = useUserPreferences();
  
  const setTimezone = async (timezone: string) => {
    return await userPreferencesService.updateUIPreferences({ timezone });
  };

  return {
    timezone: preferences?.ui_preferences?.timezone || 'UTC',
    setTimezone
  };
}

export function useCurrencyPreference() {
  const { preferences } = useUserPreferences();
  
  const setCurrency = async (currency: string) => {
    return await userPreferencesService.updateUIPreferences({ currency });
  };

  return {
    currency: preferences?.ui_preferences?.currency || 'USD',
    setCurrency
  };
}

export function useNotificationPreferences() {
  const { preferences } = useUserPreferences();
  
  const updateNotifications = async (notificationPrefs: Record<string, any>) => {
    return await userPreferencesService.updateNotificationPreferences(notificationPrefs);
  };

  return {
    notificationPreferences: preferences?.notification_settings || {},
    updateNotifications
  };
}