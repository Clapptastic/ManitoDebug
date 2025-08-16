import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatSettings {
  id?: string;
  ai_provider: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

const DEFAULT_SETTINGS: ChatSettings = {
  ai_provider: 'openai',
  ai_model: 'gpt-4.1-2025-04-14',
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: 'You are a helpful AI business advisor with access to the user\'s business data. Provide personalized strategic advice based on their competitive analyses, documents, and business context.'
};

export const useChatSettings = () => {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('chat_settings')
        .select('*')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings(data);
      } else {
        // No settings found, create default settings
        await saveSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
      setError('Failed to load chat settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<ChatSettings>) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const settingsToSave = { ...settings, ...newSettings };
      
      const { error: saveError } = await supabase
        .from('chat_settings')
        .upsert({
          user_id: user.id,
          ...settingsToSave
        });

      if (saveError) throw saveError;

      setSettings(settingsToSave);
      return true;
    } catch (error) {
      console.error('Error saving chat settings:', error);
      setError('Failed to save chat settings');
      return false;
    }
  };

  const updateSettings = (updates: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = async () => {
    return await saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    updateSettings,
    resetToDefaults,
    reloadSettings: loadSettings
  };
};