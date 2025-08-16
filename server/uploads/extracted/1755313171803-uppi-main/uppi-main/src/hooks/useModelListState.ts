
import { useState, useCallback } from 'react';
import { ApiKeyType } from '@/types/api-keys/unified';

// Updated to only include supported API key types
const DEFAULT_ENABLED_STATES: Record<ApiKeyType, boolean> = {
  openai: true,
  anthropic: true,
  google: true,
  gemini: true,
  serpapi: false,
  perplexity: true,
  groq: true,
  mistral: true,
  cohere: false,
  huggingface: false,
  newsapi: true,
  alphavantage: true,
  bing: false,
  azure: true
};

export const useModelListState = () => {
  const [enabledModels, setEnabledModels] = useState<Record<ApiKeyType, boolean>>(DEFAULT_ENABLED_STATES);
  const [loading, setLoading] = useState(false);

  const toggleModel = useCallback((keyType: ApiKeyType) => {
    setEnabledModels(prev => ({
      ...prev,
      [keyType]: !prev[keyType]
    }));
  }, []);

  const enableModel = useCallback((keyType: ApiKeyType) => {
    setEnabledModels(prev => ({
      ...prev,
      [keyType]: true
    }));
  }, []);

  const disableModel = useCallback((keyType: ApiKeyType) => {
    setEnabledModels(prev => ({
      ...prev,
      [keyType]: false
    }));
  }, []);

  const isModelEnabled = useCallback((keyType: ApiKeyType): boolean => {
    return enabledModels[keyType] || false;
  }, [enabledModels]);

  const getEnabledModels = useCallback((): ApiKeyType[] => {
    return Object.entries(enabledModels)
      .filter(([_, enabled]) => enabled)
      .map(([keyType, _]) => keyType as ApiKeyType);
  }, [enabledModels]);

  const resetToDefaults = useCallback(() => {
    setEnabledModels(DEFAULT_ENABLED_STATES);
  }, []);

  return {
    enabledModels,
    toggleModel,
    enableModel,
    disableModel,
    isModelEnabled,
    getEnabledModels,
    resetToDefaults,
    loading
  };
};
