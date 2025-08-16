/**
 * Centralized Subscription Manager
 * Prevents memory leaks and manages all real-time subscriptions
 */

import { supabase } from '@/integrations/supabase/client';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';

export interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
}

export interface ManagedSubscription {
  id: string;
  channel: any;
  config: SubscriptionConfig;
  callback: (payload: any) => void;
  createdAt: number;
  cleanup: () => void;
}

class SubscriptionManager {
  private subscriptions = new Map<string, ManagedSubscription>();
  private isDestroyed = false;

  /**
   * Create a managed subscription with automatic cleanup
   */
  subscribe<T = any>(
    id: string,
    config: SubscriptionConfig,
    callback: (payload: any) => void
  ): () => void {
    if (this.isDestroyed) {
      console.warn('SubscriptionManager is destroyed, ignoring subscription request');
      return () => {};
    }

    // Security: Block realtime subscriptions to sensitive tables like api_keys
    if (config.table === 'api_keys') {
      console.warn(`Subscription ${id} to table ${config.table} blocked: realtime on api_keys is disabled due to RLS and security.`);
      return () => {};
    }

    // Clean up existing subscription with same ID
    this.unsubscribe(id);

    const channelName = `${config.table}-${id}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const subscriptionConfig: any = {
      event: config.event || '*',
      schema: config.schema || 'public',
      table: config.table
    };

    if (config.filter) {
      subscriptionConfig.filter = config.filter;
    }

    channel.on('postgres_changes', subscriptionConfig, (payload) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Subscription callback error for ${id}:`, error);
        standardErrorHandler.handleError(error, 'realtime');
      }
    });

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscription ${id} active for table ${config.table}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Subscription ${id} error for table ${config.table}:`, err);
        // Avoid recursive cleanup loops: just drop from registry; channel is already errored/closing
        this.subscriptions.delete(id);
      } else if (status === 'TIMED_OUT') {
        console.warn(`Subscription ${id} timed out for table ${config.table}`);
        // Don't auto-unsubscribe on timeout, let it retry
      } else if (status === 'CLOSED') {
        console.log(`Subscription ${id} closed for table ${config.table}`);
        // Avoid recursive cleanup loops on CLOSED; channel is already closed
        this.subscriptions.delete(id);
      }
    });

    // Idempotent cleanup to prevent re-entrancy/recursion
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.debug(`removeChannel safe-guard for ${id}:`, e);
      } finally {
        this.subscriptions.delete(id);
      }
    };

    const subscription: ManagedSubscription = {
      id,
      channel,
      config,
      callback,
      createdAt: Date.now(),
      cleanup
    };

    this.subscriptions.set(id, subscription);

    // Return cleanup function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.cleanup();
      // Only log debug info for development, not as error
      console.debug(`[SubscriptionManager] Cleanly unsubscribed from ${id}`);
    }
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    total: number;
    byTable: Record<string, number>;
    oldestSubscription?: string;
  } {
    const stats = {
      total: this.subscriptions.size,
      byTable: {} as Record<string, number>,
      oldestSubscription: undefined as string | undefined
    };

    let oldestTime = Date.now();
    
    for (const [id, sub] of this.subscriptions) {
      const table = sub.config.table;
      stats.byTable[table] = (stats.byTable[table] || 0) + 1;
      
      if (sub.createdAt < oldestTime) {
        oldestTime = sub.createdAt;
        stats.oldestSubscription = id;
      }
    }

    return stats;
  }

  /**
   * Clean up old subscriptions (older than maxAge ms)
   */
  cleanupOld(maxAge: number = 30 * 60 * 1000): number { // 30 minutes default
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, sub] of this.subscriptions) {
      if (now - sub.createdAt > maxAge) {
        toDelete.push(id);
      }
    }

    toDelete.forEach(id => this.unsubscribe(id));
    
    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} old subscriptions`);
    }

    return toDelete.length;
  }

  /**
   * Subscribe to user-specific table updates
   */
  subscribeToUserData<T = any>(
    userId: string,
    table: string,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ): () => void {
    const id = `user-${userId}-${table}`;
    return this.subscribe(id, {
      table,
      event,
      filter: `user_id=eq.${userId}`
    }, callback);
  }

  /**
   * Subscribe to analysis updates for a user
   */
  subscribeToAnalysis(
    userId: string,
    callback: (analysis: any) => void
  ): () => void {
    return this.subscribeToUserData(userId, 'competitor_analyses', (payload) => {
      callback(payload.new);
    });
  }

  /**
   * Subscribe to API key updates for a user
   */
  subscribeToApiKeys(
    userId: string,
    callback: (apiKey: any) => void
  ): () => void {
    // Realtime is disabled for api_keys; rely on polling/RPC via UnifiedApiKeyManager
    console.info('subscribeToApiKeys: realtime disabled for api_keys. Use UnifiedApiKeyManager.getAllApiKeys with polling.');
    return () => {};
  }

  /**
   * Subscribe to document updates for a user
   */
  subscribeToDocuments(
    userId: string,
    callback: (document: any) => void
  ): () => void {
    return this.subscribeToUserData(userId, 'documents', (payload) => {
      callback(payload.new);
    });
  }

  /**
   * Destroy all subscriptions
   */
  destroy(): void {
    console.log(`Destroying SubscriptionManager with ${this.subscriptions.size} active subscriptions`);
    
    for (const subscription of this.subscriptions.values()) {
      subscription.cleanup();
    }
    
    this.subscriptions.clear();
    this.isDestroyed = true;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id);
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.destroy();
  });
}

export default subscriptionManager;