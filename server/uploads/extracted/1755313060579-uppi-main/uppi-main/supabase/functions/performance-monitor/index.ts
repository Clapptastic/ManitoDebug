import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseAdmin } from '../shared/supabase-admin.ts';
import { logInfo, logError, logMetric } from '../shared/logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceMetric {
  metric_name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring and metrics collection service
 * Phase 2 implementation for production readiness
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    
    if (req.method === 'POST') {
      // Log performance metric
      const metric: PerformanceMetric = await req.json();
      
      logMetric(metric.metric_name, metric.value, metric.metadata || {});
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Metric logged successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get performance metrics
      const url = new URL(req.url);
      const timeframe = url.searchParams.get('timeframe') || '1h';
      const metricType = url.searchParams.get('metric') || 'all';

      let interval: string;
      switch (timeframe) {
        case '1h': interval = '1 hour'; break;
        case '24h': interval = '24 hours'; break;
        case '7d': interval = '7 days'; break;
        default: interval = '1 hour';
      }

      // Get system metrics
      const metrics = await getSystemMetrics(supabaseAdmin, interval, metricType);

      return new Response(JSON.stringify({
        success: true,
        timeframe,
        metrics
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Method not allowed');

  } catch (error) {
    logError(error, 'Performance monitoring failed');
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getSystemMetrics(supabase: any, interval: string, metricType: string) {
  const metrics: any = {};

  try {
    // Database performance metrics
    if (metricType === 'all' || metricType === 'database') {
      const { data: dbMetrics, error: dbError } = await supabase
        .from('api_metrics')
        .select('*')
        .gte('created_at', new Date(Date.now() - getIntervalMs(interval)).toISOString())
        .order('created_at', { ascending: false });

      if (!dbError && dbMetrics) {
        metrics.database = {
          total_requests: dbMetrics.length,
          avg_response_time: dbMetrics.reduce((sum, m) => sum + m.response_time_ms, 0) / dbMetrics.length || 0,
          error_rate: dbMetrics.filter(m => m.status_code >= 400).length / dbMetrics.length || 0
        };
      }
    }

    // API usage metrics
    if (metricType === 'all' || metricType === 'api') {
      const { data: apiMetrics, error: apiError } = await supabase
        .from('api_usage_costs')
        .select('*')
        .gte('created_at', new Date(Date.now() - getIntervalMs(interval)).toISOString())
        .order('created_at', { ascending: false });

      if (!apiError && apiMetrics) {
        metrics.api = {
          total_calls: apiMetrics.length,
          total_cost: apiMetrics.reduce((sum, m) => sum + Number(m.cost_usd), 0),
          avg_response_time: apiMetrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / apiMetrics.length || 0,
          success_rate: apiMetrics.filter(m => m.success).length / apiMetrics.length || 0
        };
      }
    }

    // System health
    if (metricType === 'all' || metricType === 'system') {
      const { data: healthData, error: healthError } = await supabase
        .rpc('get_system_health_safe');

      if (!healthError) {
        metrics.system = healthData;
      }
    }

    return metrics;
  } catch (error) {
    logError(error, 'Failed to get system metrics');
    return {};
  }
}

function getIntervalMs(interval: string): number {
  switch (interval) {
    case '1 hour': return 60 * 60 * 1000;
    case '24 hours': return 24 * 60 * 60 * 1000;
    case '7 days': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}