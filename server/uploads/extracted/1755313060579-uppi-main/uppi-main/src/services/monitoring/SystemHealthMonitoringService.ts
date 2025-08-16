/**
 * SYSTEM HEALTH MONITORING SERVICE
 * Real-time system monitoring with performance tracking
 */

import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthMetrics {
  system_status: 'healthy' | 'warning' | 'critical';
  metrics: {
    active_transactions: number;
    slow_operations_last_hour: number;
    memory_warnings_last_hour: number;
    active_subscriptions: number;
  };
  timestamp: string;
}

export interface PerformanceLog {
  id: string;
  operation_name: string;
  execution_time_ms: number;
  user_id?: string;
  component: string;
  status: string; // Use string instead of union type for flexibility
  error_details?: any;
  metadata?: any;
  created_at: string;
}

export interface TransactionStatus {
  id: string;
  transaction_id: string;
  user_id: string;
  operation_type: string;
  current_step: number;
  total_steps: number;
  status: string; // Use string for flexibility with database values
  steps_completed: any;
  rollback_data: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  updated_at: string;
}

class SystemHealthMonitoringService {
  /**
   * Get overall system health overview (admin only)
   */
  async getSystemHealthOverview(): Promise<SystemHealthMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('get_system_health_overview');
      
      if (error) {
        console.error('Error fetching system health:', error);
        throw error;
      }
      
      return data as unknown as SystemHealthMetrics;
    } catch (error) {
      console.error('System health monitoring error:', error);
      return null;
    }
  }

  /**
   * Log performance metric for an operation
   */
  async logPerformanceMetric(
    operationName: string,
    executionTimeMs: number,
    component: string = 'frontend',
    status: 'success' | 'error' | 'timeout' = 'success',
    metadata?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('log_performance_metric', {
        operation_name_param: operationName,
        execution_time_ms_param: executionTimeMs,
        component_param: component,
        status_param: status,
        metadata_param: metadata || {}
      });
      
      if (error) {
        console.error('Error logging performance metric:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Performance logging error:', error);
      return false;
    }
  }

  /**
   * Start a transaction log for multi-step operations
   */
  async startTransactionLog(
    operationType: string,
    totalSteps: number,
    metadata?: any
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('start_transaction_log', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
        operation_type_param: operationType,
        total_steps_param: totalSteps,
        metadata_param: metadata || {}
      });
      
      if (error) {
        console.error('Error starting transaction log:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction start error:', error);
      return null;
    }
  }

  /**
   * Update transaction step
   */
  async updateTransactionStep(
    transactionId: string,
    stepNumber: number,
    stepData?: any,
    rollbackData?: any
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_transaction_step', {
        transaction_id_param: transactionId,
        step_number: stepNumber,
        step_data: stepData || {},
        rollback_data_param: rollbackData || {}
      });
      
      if (error) {
        console.error('Error updating transaction step:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction step update error:', error);
      return false;
    }
  }

  /**
   * Complete transaction (success or failure)
   */
  async completeTransaction(
    transactionId: string,
    success: boolean = true
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('complete_transaction', {
        transaction_id_param: transactionId,
        success: success
      });
      
      if (error) {
        console.error('Error completing transaction:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction completion error:', error);
      return false;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(
    transactionId: string,
    errorMessage?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('rollback_transaction', {
        transaction_id_param: transactionId,
        error_message_param: errorMessage
      });
      
      if (error) {
        console.error('Error rolling back transaction:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction rollback error:', error);
      return null;
    }
  }

  /**
   * Get performance logs for user (with optional filters)
   */
  async getPerformanceLogs(
    limit: number = 100,
    component?: string,
    since?: Date
  ): Promise<PerformanceLog[]> {
    try {
      let query = supabase
        .from('performance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (component) {
        query = query.eq('component', component);
      }

      if (since) {
        query = query.gte('created_at', since.toISOString());
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching performance logs:', error);
        return [];
      }
      
      return (data || []) as PerformanceLog[];
    } catch (error) {
      console.error('Performance logs fetch error:', error);
      return [];
    }
  }

  /**
   * Get transaction logs for user
   */
  async getTransactionLogs(
    limit: number = 50,
    status?: string
  ): Promise<TransactionStatus[]> {
    try {
      let query = supabase
        .from('transaction_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching transaction logs:', error);
        return [];
      }
      
      return (data || []) as TransactionStatus[];
    } catch (error) {
      console.error('Transaction logs fetch error:', error);
      return [];
    }
  }

  /**
   * Track real-time subscription
   */
  async trackRealtimeSubscription(
    channelName: string,
    subscriptionType: string,
    action: 'subscribe' | 'unsubscribe' | 'heartbeat',
    metadata?: any
  ): Promise<boolean> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return false;

      const { error } = await supabase.rpc('track_realtime_subscription', {
        user_id_param: user.id,
        channel_name_param: channelName,
        subscription_type_param: subscriptionType,
        action_param: action,
        metadata_param: metadata || {}
      });
      
      if (error) {
        console.error('Error tracking realtime subscription:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Realtime subscription tracking error:', error);
      return false;
    }
  }

  /**
   * Performance monitoring wrapper for async operations
   */
  async withPerformanceMonitoring<T>(
    operationName: string,
    operation: () => Promise<T>,
    component: string = 'frontend',
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let status: 'success' | 'error' = 'success';
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      const executionTime = Math.round(performance.now() - startTime);
      
      // Log performance metric (don't await to avoid blocking)
      this.logPerformanceMetric(
        operationName,
        executionTime,
        component,
        status,
        {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      ).catch(console.error);
    }
  }

  /**
   * Transaction wrapper for multi-step operations
   */
  async withTransactionMonitoring<T>(
    operationType: string,
    totalSteps: number,
    operation: (updateStep: (step: number, data?: any, rollbackData?: any) => Promise<boolean>) => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const transactionId = await this.startTransactionLog(operationType, totalSteps, metadata);
    
    if (!transactionId) {
      throw new Error('Failed to start transaction monitoring');
    }

    try {
      const updateStep = async (step: number, data?: any, rollbackData?: any) => {
        return await this.updateTransactionStep(transactionId, step, data, rollbackData);
      };

      const result = await operation(updateStep);
      
      await this.completeTransaction(transactionId, true);
      return result;
    } catch (error) {
      await this.completeTransaction(transactionId, false);
      
      // Attempt rollback
      const rollbackResult = await this.rollbackTransaction(
        transactionId, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      if (rollbackResult?.success) {
        console.log('Transaction rolled back successfully:', rollbackResult);
      }
      
      throw error;
    }
  }

  /**
   * Get system health status for dashboard display
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    lastUpdated: string;
  } | null> {
    try {
      const health = await this.getSystemHealthOverview();
      if (!health) return null;

      // Calculate health score based on metrics
      let score = 100;
      
      if (health.metrics.slow_operations_last_hour > 10) score -= 20;
      if (health.metrics.memory_warnings_last_hour > 0) score -= 15;
      if (health.metrics.active_transactions > 20) score -= 10;
      
      score = Math.max(0, score);

      return {
        status: health.system_status,
        score,
        lastUpdated: health.timestamp
      };
    } catch (error) {
      console.error('Health status check error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const systemHealthMonitor = new SystemHealthMonitoringService();
export default SystemHealthMonitoringService;