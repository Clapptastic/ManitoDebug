/**
 * Enhanced Analytics Hook
 * Provides comprehensive analytics functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedAnalyticsService, MetricsData } from '@/services/analytics/enhancedAnalyticsService';

export interface UseEnhancedAnalyticsReturn {
  metrics: MetricsData | null;
  insights: any | null;
  isLoading: boolean;
  error: string | null;
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackPageView: (pageName: string, properties?: Record<string, any>) => Promise<void>;
  trackUserAction: (action: string, properties?: Record<string, any>) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  getInsights: (timeframe?: '24h' | '7d' | '30d') => Promise<void>;
}

export const useEnhancedAnalytics = (): UseEnhancedAnalyticsReturn => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = useCallback(async (eventName: string, properties?: Record<string, any>) => {
    try {
      await enhancedAnalyticsService.trackEvent({
        event_name: eventName,
        properties
      });
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  const trackPageView = useCallback(async (pageName: string, properties?: Record<string, any>) => {
    try {
      await enhancedAnalyticsService.trackPageView(pageName, properties);
    } catch (err) {
      console.error('Failed to track page view:', err);
    }
  }, []);

  const trackUserAction = useCallback(async (action: string, properties?: Record<string, any>) => {
    try {
      await enhancedAnalyticsService.trackUserAction(action, properties);
    } catch (err) {
      console.error('Failed to track user action:', err);
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const systemMetrics = await enhancedAnalyticsService.getSystemMetrics();
      setMetrics(systemMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInsights = useCallback(async (timeframe: '24h' | '7d' | '30d' = '24h') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const analyticsInsights = await enhancedAnalyticsService.getAnalyticsInsights(timeframe);
      setInsights(analyticsInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    insights,
    isLoading,
    error,
    trackEvent,
    trackPageView,
    trackUserAction,
    refreshMetrics,
    getInsights
  };
};