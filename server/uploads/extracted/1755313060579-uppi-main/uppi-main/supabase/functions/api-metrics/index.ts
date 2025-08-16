import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error(`User not authenticated: ${userError?.message || 'Unknown error'}`);
    }

    const { action, timeRange = '24h' } = await req.json();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (action === 'summary') {
      const { data, error } = await supabaseAdmin
        .from('api_usage_costs')
        .select('provider, success, response_time_ms, tokens_used, cost_usd')
        .eq('user_id', user.id)
        .gte('created_at', cutoffTime);

      if (error) throw error;

      const grouped = (data || []).reduce((acc: Record<string, any>, row: any) => {
        const provider = row.provider || 'unknown';
        if (!acc[provider]) {
          acc[provider] = {
            provider,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            total_cost: 0,
            total_response_time: 0,
            total_tokens: 0,
          };
        }
        acc[provider].total_requests++;
        if (row.success) acc[provider].successful_requests++; else acc[provider].failed_requests++;
        acc[provider].total_cost += Number(row.cost_usd ?? 0) || 0;
        acc[provider].total_response_time += Number(row.response_time_ms ?? 0) || 0;
        acc[provider].total_tokens += Number(row.tokens_used ?? 0) || 0;
        return acc;
      }, {} as Record<string, any>);

      const summaries = Object.values(grouped).map((summary: any) => ({
        provider: summary.provider,
        total_requests: summary.total_requests,
        successful_requests: summary.successful_requests,
        failed_requests: summary.failed_requests,
        total_cost: summary.total_cost,
        avg_response_time: summary.total_requests > 0 ? summary.total_response_time / summary.total_requests : 0,
        total_tokens: summary.total_tokens,
        error_rate: summary.total_requests > 0 ? summary.failed_requests / summary.total_requests : 0,
        uptime_percentage: summary.total_requests > 0 ? (summary.successful_requests / summary.total_requests) * 100 : 100,
      }));

      return new Response(JSON.stringify({ summaries }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'costs') {
      const { data, error } = await supabaseAdmin
        .from('api_usage_costs')
        .select('provider, model_used, tokens_used, cost_usd')
        .eq('user_id', user.id)
        .gte('created_at', cutoffTime);
      if (error) throw error;

      const map = new Map<string, { provider: string; model: string; requests: number; cost: number; tokens: number }>();
      for (const row of data || []) {
        const provider = row.provider || 'unknown';
        const model = row.model_used || 'unknown';
        const key = `${provider}::${model}`;
        const cur = map.get(key) || { provider, model, requests: 0, cost: 0, tokens: 0 };
        cur.requests += 1;
        cur.cost += Number(row.cost_usd ?? 0) || 0;
        cur.tokens += Number(row.tokens_used ?? 0) || 0;
        map.set(key, cur);
      }
      const costs = Array.from(map.values());
      return new Response(JSON.stringify({ costs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'health') {
      const { data, error } = await supabaseAdmin
        .from('api_usage_costs')
        .select('provider, success, response_time_ms')
        .eq('user_id', user.id)
        .gte('created_at', cutoffTime);
      if (error) throw error;

      const agg = (data || []).reduce((acc: Record<string, any>, row: any) => {
        const provider = row.provider || 'unknown';
        if (!acc[provider]) {
          acc[provider] = { total: 0, success: 0, totalLatency: 0 };
        }
        acc[provider].total += 1;
        if (row.success) acc[provider].success += 1;
        acc[provider].totalLatency += Number(row.response_time_ms ?? 0) || 0;
        return acc;
      }, {} as Record<string, any>);

      const health: Record<string, { status: 'healthy' | 'degraded' | 'down'; latency: number; uptime: number }> = {};
      for (const [provider, v] of Object.entries(agg)) {
        const uptime = v.total > 0 ? (v.success / v.total) * 100 : 100;
        const latency = v.total > 0 ? v.totalLatency / v.total : 0;
        let status: 'healthy' | 'degraded' | 'down' = 'healthy';
        const errorRate = v.total > 0 ? (1 - v.success / v.total) : 0;
        if (errorRate >= 0.2 || uptime < 80) status = 'down';
        else if (errorRate >= 0.05 || latency > 2000) status = 'degraded';
        health[provider] = { status, latency, uptime };
      }

      return new Response(JSON.stringify({ health }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});