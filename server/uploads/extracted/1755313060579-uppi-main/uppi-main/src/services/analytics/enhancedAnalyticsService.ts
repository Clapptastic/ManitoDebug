/**
 * Enhanced Analytics Service
 * Comprehensive analytics tracking and reporting
 */

import { supabase } from '@/integrations/supabase/client';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface MetricsData {
  totalUsers: number;
  activeUsers: number;
  analysesCompleted: number;
  apiKeyValidations: number;
  documentsUploaded: number;
  errorRate: number;
  avgResponseTime: number;
}

export class EnhancedAnalyticsService {
  private static instance: EnhancedAnalyticsService;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): EnhancedAnalyticsService {
    if (!EnhancedAnalyticsService.instance) {
      EnhancedAnalyticsService.instance = new EnhancedAnalyticsService();
    }
    return EnhancedAnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const enrichedEvent = {
        ...event,
        user_id: user?.id || event.user_id,
        session_id: this.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Store in edge function metrics for now (can be expanded to dedicated analytics table)
      await supabase
        .from('edge_function_metrics')
        .insert({
          function_name: 'analytics_event',
          status: 'success',
          execution_time_ms: 0,
          user_id: enrichedEvent.user_id
        });

    } catch (error) {
      // Don't throw analytics errors, just log them
      console.warn('Analytics tracking failed:', error);
    }
  }

  async trackPageView(pageName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event_name: 'page_view',
      properties: {
        page_name: pageName,
        ...properties
      }
    });
  }

  async trackUserAction(action: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event_name: 'user_action',
      properties: {
        action,
        ...properties
      }
    });
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await this.trackEvent({
      event_name: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        context
      }
    });
  }

  async getSystemMetrics(): Promise<MetricsData> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get total and active users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, updated_at');

      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => 
        new Date(p.updated_at) > twentyFourHoursAgo
      ).length || 0;

      // Get analyses completed
      const { data: analyses } = await supabase
        .from('competitor_analyses')
        .select('id')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      const analysesCompleted = analyses?.length || 0;

      const { data } = await supabase
        .rpc('manage_api_key', { operation: 'select' });

      const apiKeyValidations = Array.isArray(data) 
        ? data.filter((k: any) => k.last_validated && new Date(k.last_validated) > twentyFourHoursAgo).length 
        : 0;

      // Get documents uploaded
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      const documentsUploaded = documents?.length || 0;

      // Get error metrics
      const { data: errorMetrics } = await supabase
        .from('edge_function_metrics')
        .select('status, execution_time_ms')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      const totalRequests = errorMetrics?.length || 0;
      const errorRequests = errorMetrics?.filter(m => m.status !== 'success').length || 0;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

      const avgResponseTime = errorMetrics?.length > 0 
        ? errorMetrics.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0) / errorMetrics.length
        : 0;

      return {
        totalUsers,
        activeUsers,
        analysesCompleted,
        apiKeyValidations,
        documentsUploaded,
        errorRate,
        avgResponseTime
      };
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get system metrics');
      return {
        totalUsers: 0,
        activeUsers: 0,
        analysesCompleted: 0,
        apiKeyValidations: 0,
        documentsUploaded: 0,
        errorRate: 0,
        avgResponseTime: 0
      };
    }
  }

  async getAnalyticsInsights(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('edge_function_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for insights
      const insights = {
        totalEvents: data?.length || 0,
        uniqueUsers: new Set(data?.map(d => d.user_id).filter(Boolean)).size,
        avgExecutionTime: data?.length > 0 
          ? data.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) / data.length
          : 0,
        errorCount: data?.filter(d => d.status !== 'success').length || 0,
        timeSeriesData: this.groupByHour(data || [])
      };

      return insights;
    } catch (error) {
      standardErrorHandler.handleError(error, 'Failed to get analytics insights');
      return null;
    }
  }

  private groupByHour(data: any[]): any[] {
    const grouped = data.reduce((acc, item) => {
      const hour = new Date(item.created_at).getHours();
      if (!acc[hour]) {
        acc[hour] = { hour, count: 0, totalTime: 0 };
      }
      acc[hour].count++;
      acc[hour].totalTime += item.execution_time_ms || 0;
      return acc;
    }, {} as Record<number, any>);

    return Object.values(grouped);
  }
}

export const enhancedAnalyticsService = EnhancedAnalyticsService.getInstance();