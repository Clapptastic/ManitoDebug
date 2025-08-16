
import { useCallback } from 'react';
import { MicroserviceConfig } from '@/types/api-keys/microservice';

interface MicroserviceClientOptions {
  baseUrl: string;
  customHeaders?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
  };
}

const defaultOptions: MicroserviceClientOptions = {
  baseUrl: '',
  customHeaders: {},
  retryConfig: {
    maxRetries: 3,
    delayMs: 1000
  }
};

export const useMicroserviceClient = (config?: MicroserviceConfig) => {
  const getClientOptions = useCallback((): MicroserviceClientOptions => {
    if (!config) return defaultOptions;
    
    return {
      baseUrl: config.base_url || '',
      customHeaders: {
        'X-API-Key': config.api_key || ''
      },
      retryConfig: {
        maxRetries: 3,
        delayMs: 1000
      }
    };
  }, [config]);

  const isServiceActive = useCallback(() => {
    if (!config) return false;
    return config.is_active || false;
  }, [config]);

  const getServiceEndpoints = useCallback(() => {
    return config?.endpoints || [];
  }, [config]);

  const getEndpointByPath = useCallback((path: string) => {
    if (!config?.endpoints) return null;
    return config.endpoints.find(endpoint => endpoint.path === path);
  }, [config]);

  const hasAuthEndpoints = useCallback(() => {
    if (!config?.endpoints) return false;
    return config.endpoints.some(endpoint => endpoint.requires_auth);
  }, [config]);

  const isServiceHealthy = useCallback(async () => {
    if (!isServiceActive() || !config?.health_check_path) {
      return false;
    }
    
    try {
      const options = getClientOptions();
      const response = await fetch(`${options.baseUrl}${config.health_check_path}`, {
        method: 'GET',
        headers: {
          ...options.customHeaders
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, [config, getClientOptions, isServiceActive]);

  return {
    getClientOptions,
    isServiceActive,
    getServiceEndpoints,
    getEndpointByPath,
    hasAuthEndpoints,
    isServiceHealthy
  };
};
