import { supabase } from '@/integrations/supabase/client';

export interface ApiMetric {
  id: string;
  provider: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  tokens_used: number;
  cost_usd: number;
  model_used?: string;
  error_message?: string;
  timestamp: string;
  user_id: string;
}

export interface ApiUsageSummary {
  provider: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost: number;
  avg_response_time: number;
  total_tokens: number;
  error_rate: number;
  uptime_percentage: number;
}

export interface ApiCostBreakdown {
  provider: string;
  model: string;
  requests: number;
  cost: number;
  tokens: number;
}

class ApiMonitoringService {
  async logApiCall(data: {
    provider: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    tokensUsed?: number;
    cost?: number;
    model?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('log-api-metric', {
        body: data
      });
      
      if (error) {
        console.error('Failed to log API metric:', error);
      }
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  async getUsageSummary(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<ApiUsageSummary[]> {
    try {
      const { data, error } = await supabase.functions.invoke('api-metrics', {
        body: { action: 'summary', timeRange }
      });

      if (error) throw error;
      return data?.summaries || [];
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      return this.getFallbackSummary();
    }
  }

  async getCostBreakdown(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<ApiCostBreakdown[]> {
    try {
      const { data, error } = await supabase.functions.invoke('api-metrics', {
        body: { action: 'costs', timeRange }
      });

      if (error) throw error;
      return data?.costs || [];
    } catch (error) {
      console.error('Error fetching cost breakdown:', error);
      return [];
    }
  }

  async getRecentErrors(limit: number = 10): Promise<ApiMetric[]> {
    try {
      const { data, error } = await supabase
        .from('api_usage_costs')
        .select('*')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data?.map(this.transformMetric) || [];
    } catch (error) {
      console.error('Error fetching recent errors:', error);
      return [];
    }
  }

  async getProviderHealth(): Promise<Record<string, { status: 'healthy' | 'degraded' | 'down'; latency: number; uptime: number }>> {
    try {
      const { data, error } = await supabase.functions.invoke('api-metrics', {
        body: { action: 'health' }
      });

      if (error) throw error;
      return data?.health || {};
    } catch (error) {
      console.error('Error fetching provider health:', error);
      return {};
    }
  }

  private transformMetric(row: any): ApiMetric {
    return {
      id: row.id,
      provider: row.provider,
      endpoint: row.endpoint,
      method: 'POST',
      status_code: row.success ? 200 : 500,
      response_time_ms: row.response_time_ms || 0,
      tokens_used: row.tokens_used || 0,
      cost_usd: Number(row.cost_usd ?? 0) || 0,
      model_used: row.model_used,
      error_message: row.error_message,
      timestamp: row.created_at,
      user_id: row.user_id
    };
  }

  private getFallbackSummary(): ApiUsageSummary[] {
    return [
      {
        provider: 'openai',
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        total_cost: 0,
        avg_response_time: 0,
        total_tokens: 0,
        error_rate: 0,
        uptime_percentage: 100
      }
    ];
  }
}

export const apiMonitoringService = new ApiMonitoringService();