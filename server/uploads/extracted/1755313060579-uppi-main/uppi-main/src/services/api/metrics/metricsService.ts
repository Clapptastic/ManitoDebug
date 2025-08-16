
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ApiMetricsData {
  provider: string;
  model: string;
  endpoint: string;
  query_cost: number;
  token_count: number;
  confidence_score: number;
  status: string;
  error_message?: string;
}

export async function logApiMetrics(metrics: ApiMetricsData): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      console.log('No user session found, metrics will be anonymous');
    }
    
    const userId = sessionData.session?.user?.id;
    
    // Use proper typing for the insert operation
    const metricsRecord = {
      provider: metrics.provider,
      model: metrics.model,
      query_cost: metrics.query_cost,
      token_count: metrics.token_count,
      confidence_score: metrics.confidence_score,
      endpoint: metrics.endpoint,
      status: metrics.status,
      error_message: metrics.error_message,
      user_id: userId || null
    };

    const { error } = await supabase
      .from('edge_function_metrics')
      .insert({
        function_name: `${metrics.provider}-${metrics.endpoint}`,
        status: metrics.status,
        execution_time_ms: metrics.token_count || 0,
        user_id: userId || null,
        timestamp: new Date().toISOString(),
        error_message: metrics.error_message
      });
      
    if (error) {
      console.error('Error logging API metrics:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception when logging API metrics:', error);
    return false;
  }
}

export async function getApiMetrics(userId: string | null = null): Promise<any[]> {
  try {
    let query = supabase
      .from('edge_function_metrics')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.limit(100);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching API metrics:', error);
    toast({
      title: 'Error',
      description: 'Failed to fetch API usage metrics',
      variant: 'destructive'
    });
    return [];
  }
}

export async function getApiMetricsSummary(): Promise<any> {
  try {
    // Since RPC function doesn't exist, return mock summary from edge_function_metrics
    const { data, error } = await supabase
      .from('edge_function_metrics')
      .select('function_name, status, execution_time_ms')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching API metrics summary:', error);
    toast({
      title: 'Error',
      description: 'Failed to fetch API usage summary',
      variant: 'destructive'
    });
    return [];
  }
}
