/**
 * Real-time Service
 * Manages real-time subscriptions and updates
 */

import { subscriptionManager } from '@/services/core/SubscriptionManager';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';
import { toast } from '@/hooks/use-toast';

export interface RealtimeSubscription {
  id: string;
  unsubscribe: () => void;
}

export class RealtimeService {
  private static instance: RealtimeService;

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  subscribeToAnalysisUpdates(
    userId: string,
    onUpdate: (analysis: any) => void
  ): RealtimeSubscription {
    // Use stable subscription ID to prevent duplicates
    const subscriptionId = `analysis_${userId}`;
    
    const cleanup = subscriptionManager.subscribe(
      subscriptionId,
      {
        table: 'competitor_analyses',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        try {
          onUpdate(payload.new);
          
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
            toast({
              title: 'Analysis Complete',
              description: `Competitor analysis for "${payload.new.name}" has been completed.`,
            });
          }
        } catch (error) {
          standardErrorHandler.handleError(error, 'Real-time update error');
        }
      }
    );

    return {
      id: subscriptionId,
      unsubscribe: cleanup
    };
  }

  subscribeToApiKeyUpdates(
    userId: string,
    onUpdate: (apiKey: any) => void
  ): RealtimeSubscription {
    const subscriptionId = `apikeys_${userId}_${Date.now()}`;
    
    const cleanup = subscriptionManager.subscribe(
      subscriptionId,
      {
        table: 'api_keys',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        try {
          onUpdate(payload.new);
          
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'active') {
            toast({
              title: 'API Key Validated',
              description: `${payload.new.provider} API key is now active.`,
            });
          }
        } catch (error) {
          standardErrorHandler.handleError(error, 'API key update error');
        }
      }
    );

    return {
      id: subscriptionId,
      unsubscribe: cleanup
    };
  }

  subscribeToDocumentUpdates(
    userId: string,
    onUpdate: (document: any) => void
  ): RealtimeSubscription {
    const subscriptionId = `documents_${userId}_${Date.now()}`;
    
    const cleanup = subscriptionManager.subscribe(
      subscriptionId,
      {
        table: 'documents',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        try {
          onUpdate(payload.new);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'Document Uploaded',
              description: `"${payload.new.name}" has been uploaded successfully.`,
            });
          }
        } catch (error) {
          standardErrorHandler.handleError(error, 'Document update error');
        }
      }
    );

    return {
      id: subscriptionId,
      unsubscribe: cleanup
    };
  }

  unsubscribeAll(): void {
    // Delegated to SubscriptionManager
    console.log('Cleanup delegated to SubscriptionManager');
  }

  unsubscribe(subscriptionId: string): void {
    subscriptionManager.unsubscribe(subscriptionId);
  }
}

export const realtimeService = RealtimeService.getInstance();