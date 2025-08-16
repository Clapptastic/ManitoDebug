/**
 * Real-time API Keys Hook
 * Provides real-time updates for API key status changes
 */

import { useEffect, useState, useCallback } from 'react';
import { realtimeService } from '@/services/realtime/realtimeService';
import { useAuth } from '@/hooks/useAuth';
import { ApiKey } from '@/types/api-keys/unified';

export interface UseRealtimeApiKeysReturn {
  updatedApiKey: ApiKey | null;
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (onUpdate: (apiKey: ApiKey) => void) => void;
  unsubscribe: () => void;
}

export const useRealtimeApiKeys = (): UseRealtimeApiKeysReturn => {
  const { user } = useAuth();
  const [updatedApiKey, setUpdatedApiKey] = useState<ApiKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const subscribe = useCallback((onUpdate: (apiKey: ApiKey) => void) => {
    if (!user?.id) {
      setConnectionError('User not authenticated');
      return;
    }

    try {
      const sub = realtimeService.subscribeToApiKeyUpdates(
        user.id,
        (apiKey: ApiKey) => {
          setUpdatedApiKey(apiKey);
          onUpdate(apiKey);
          setIsConnected(true);
          setConnectionError(null);
        }
      );

      setSubscription(sub);
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [user?.id]);

  const unsubscribe = useCallback(() => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
    setIsConnected(false);
    setUpdatedApiKey(null);
  }, [subscription]);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    updatedApiKey,
    isConnected,
    connectionError,
    subscribe,
    unsubscribe
  };
};