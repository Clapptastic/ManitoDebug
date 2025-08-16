/**
 * Real-time Analysis Hook
 * Provides real-time updates for competitor analysis progress
 * Fixed to prevent subscription leaks and excessive re-connections
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService } from '@/services/realtime/realtimeService';
import { useAuth } from '@/hooks/useAuth';
import { CompetitorAnalysis } from '@/types/core/interfaces';

export interface UseRealtimeAnalysisReturn {
  currentAnalysis: CompetitorAnalysis | null;
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (onUpdate: (analysis: CompetitorAnalysis) => void) => void;
  unsubscribe: () => void;
}

export const useRealtimeAnalysis = (): UseRealtimeAnalysisReturn => {
  const { user } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Use refs to prevent memory leaks and excessive subscriptions
  const subscriptionRef = useRef<any>(null);
  const callbackRef = useRef<((analysis: CompetitorAnalysis) => void) | null>(null);

  const subscribe = useCallback((onUpdate: (analysis: CompetitorAnalysis) => void) => {
    if (!user?.id) {
      setConnectionError('User not authenticated');
      return;
    }

    // Prevent multiple subscriptions
    if (subscriptionRef.current) {
      console.log('Subscription already exists, skipping...');
      callbackRef.current = onUpdate; // Update callback only
      return;
    }

    try {
      const sub = realtimeService.subscribeToAnalysisUpdates(
        user.id,
        (analysis: CompetitorAnalysis) => {
          setCurrentAnalysis(analysis);
          onUpdate(analysis);
          callbackRef.current?.(analysis);
          setIsConnected(true);
          setConnectionError(null);
        }
      );

      subscriptionRef.current = sub;
      callbackRef.current = onUpdate;
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [user?.id]);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
      subscriptionRef.current = null;
    }
    callbackRef.current = null;
    setIsConnected(false);
    setCurrentAnalysis(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    currentAnalysis,
    isConnected,
    connectionError,
    subscribe,
    unsubscribe
  };
};