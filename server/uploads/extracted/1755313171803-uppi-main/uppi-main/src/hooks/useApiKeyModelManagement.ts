
import { useState, useCallback } from 'react';
import { ApiKeyType } from '@/types/api-keys/unified';
import { AIModelRegistry } from '@/services/ai/modelRegistry';

// Get updated default models from registry
const DEFAULT_MODELS: Record<ApiKeyType, string> = {
  openai: AIModelRegistry.getBestModel('openai'),
  anthropic: AIModelRegistry.getBestModel('anthropic'),
  google: 'gemini-pro',
  gemini: 'gemini-pro',
  serpapi: 'google',
  perplexity: AIModelRegistry.getBestModel('perplexity'),
  groq: 'llama-3.1-70b-versatile',
  mistral: 'mistral-large',
  cohere: 'command-r-plus',
  huggingface: 'microsoft/DialoGPT-medium',
  newsapi: 'everything',
  alphavantage: 'global_quote',
  bing: 'web-search',
  azure: 'gpt-4'
};

export const useApiKeyModelManagement = () => {
  const [selectedModels, setSelectedModels] = useState<Record<ApiKeyType, string>>(DEFAULT_MODELS);
  const [loading, setLoading] = useState(false);

  const updateModel = useCallback((keyType: ApiKeyType, model: string) => {
    // Check for model deprecation and warn/replace if needed
    if (['openai', 'anthropic', 'perplexity'].includes(keyType)) {
      const deprecationCheck = AIModelRegistry.checkDeprecation(model);
      if (deprecationCheck.isDeprecated) {
        console.warn(`⚠️ ${deprecationCheck.warning}`);
        const replacement = deprecationCheck.replacement || AIModelRegistry.getBestModel(keyType);
        setSelectedModels(prev => ({
          ...prev,
          [keyType]: replacement
        }));
        return;
      }
    }

    setSelectedModels(prev => ({
      ...prev,
      [keyType]: model
    }));
  }, []);

  const getModelForKeyType = useCallback((keyType: ApiKeyType): string => {
    const selectedModel = selectedModels[keyType];
    
    // For AI providers, check deprecation and return best available
    if (['openai', 'anthropic', 'perplexity'].includes(keyType)) {
      return AIModelRegistry.getBestModel(keyType, selectedModel);
    }
    
    return selectedModel || DEFAULT_MODELS[keyType];
  }, [selectedModels]);

  const resetToDefaults = useCallback(() => {
    // Get fresh defaults with current model recommendations
    const freshDefaults = {
      ...DEFAULT_MODELS,
      openai: AIModelRegistry.getBestModel('openai'),
      anthropic: AIModelRegistry.getBestModel('anthropic'),
      perplexity: AIModelRegistry.getBestModel('perplexity'),
    };
    setSelectedModels(freshDefaults);
  }, []);

  const getAvailableModels = useCallback((keyType: ApiKeyType) => {
    if (keyType === 'openai') {
      return AIModelRegistry.getCurrentModels('openai').map(m => ({
        id: m.id,
        name: m.displayName,
        description: m.description
      }));
    }
    if (keyType === 'anthropic') {
      return AIModelRegistry.getCurrentModels('anthropic').map(m => ({
        id: m.id,
        name: m.displayName,
        description: m.description
      }));
    }
    if (keyType === 'perplexity') {
      return AIModelRegistry.getCurrentModels('perplexity').map(m => ({
        id: m.id,
        name: m.displayName,
        description: m.description
      }));
    }
    return [];
  }, []);

  return {
    selectedModels,
    updateModel,
    getModelForKeyType,
    resetToDefaults,
    getAvailableModels,
    loading
  };
};
