import { useState, useEffect } from 'react';
import { translationService } from '@/services/core/translationService';
import { userPreferencesService } from '@/services/core/userPreferencesService';

interface UseTranslationReturn {
  t: (key: string, namespace?: string) => string;
  language: string;
  setLanguage: (locale: string) => Promise<void>;
  isLoading: boolean;
  translations: Record<string, string>;
}

export function useTranslation(defaultNamespace: string = 'common'): UseTranslationReturn {
  const [language, setLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load initial language and translations
  useEffect(() => {
    loadLanguageAndTranslations();
  }, []);

  const loadLanguageAndTranslations = async () => {
    try {
      setIsLoading(true);
      
      // Get user's preferred language
      const userLanguage = await userPreferencesService.getLanguage();
      setLanguageState(userLanguage);
      
      // Load translations for the language and namespace
      const translationsData = await translationService.getTranslations(userLanguage, defaultNamespace);
      setTranslations(translationsData);
    } catch (error) {
      console.error('Error loading language and translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Translation function
  const t = (key: string, namespace?: string): string => {
    const translationKey = namespace ? `${namespace}.${key}` : key;
    return translations[translationKey] || translations[key] || key;
  };

  // Change language function
  const setLanguage = async (locale: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Update user preferences
      await userPreferencesService.updateUIPreferences({ language: locale });
      
      // Load new translations
      const newTranslations = await translationService.getTranslations(locale, defaultNamespace);
      
      setLanguageState(locale);
      setTranslations(newTranslations);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    language,
    setLanguage,
    isLoading,
    translations
  };
}

// Hook for multiple namespaces
export function useTranslations(namespaces: string[]): UseTranslationReturn {
  const [language, setLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllTranslations();
  }, []);

  const loadAllTranslations = async () => {
    try {
      setIsLoading(true);
      
      // Get user's preferred language
      const userLanguage = await userPreferencesService.getLanguage();
      setLanguageState(userLanguage);
      
      // Load translations for all namespaces
      const allTranslations: Record<string, string> = {};
      
      for (const namespace of namespaces) {
        const namespaceTranslations = await translationService.getTranslations(userLanguage, namespace);
        
        // Prefix keys with namespace
        Object.entries(namespaceTranslations).forEach(([key, value]) => {
          allTranslations[`${namespace}.${key}`] = value;
          // Also add without namespace for backwards compatibility
          allTranslations[key] = value;
        });
      }
      
      setTranslations(allTranslations);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, namespace?: string): string => {
    const translationKey = namespace ? `${namespace}.${key}` : key;
    return translations[translationKey] || translations[key] || key;
  };

  const setLanguage = async (locale: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Update user preferences
      await userPreferencesService.updateUIPreferences({ language: locale });
      
      // Reload all translations
      await loadAllTranslations();
      
      setLanguageState(locale);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    language,
    setLanguage,
    isLoading,
    translations
  };
}