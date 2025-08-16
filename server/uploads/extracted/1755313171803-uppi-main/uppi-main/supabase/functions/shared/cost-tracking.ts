import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CostTrackingData {
  userId: string;
  provider: string;
  endpoint: string;
  method?: string;
  status: number;
  cost: number;
  latency: number;
  tokensUsed?: number;
  modelUsed?: string;
}

export const logApiCost = async (data: CostTrackingData) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env config');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Insert detailed usage cost (primary)
    const { error: insertError } = await supabase
      .from('api_usage_costs')
      .insert({
        user_id: data.userId,
        provider: data.provider,
        service: 'competitor_analysis',
        endpoint: data.endpoint,
        response_time_ms: Math.round(data.latency),
        success: data.status >= 200 && data.status < 400,
        operation_type: data.method || 'POST',
        usage_count: 1,
        cost_usd: data.cost,
        metadata: {
          tokens_used: data.tokensUsed || 0,
          model_used: data.modelUsed || null
        }
      });

    if (insertError) {
      console.error('Error inserting api_usage_costs:', insertError);
    }

    // Optional: legacy metrics table for backwards compatibility
    const { error: metricsErr } = await supabase
      .from('api_metrics')
      .insert({
        user_id: data.userId,
        provider: data.provider,
        endpoint: data.endpoint,
        method: data.method || 'POST',
        status_code: data.status,
        response_time_ms: Math.round(data.latency)
      });

    if (metricsErr) {
      // Non-fatal
      console.warn('api_metrics insert warning:', metricsErr.message);
    }
  } catch (error) {
    console.error('Error logging API cost:', error);
  }
};

export const updateCompetitorAnalysisCost = async (
  analysisId: string,
  cost: number
) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env config');

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from('competitor_analyses')
      .update({ actual_cost: cost })
      .eq('id', analysisId);

    if (error) {
      console.error('Error updating competitor_analyses.actual_cost:', error);
    }
  } catch (error) {
    console.error('Error updating competitor analysis cost:', error);
  }
};

// Helper function to calculate OpenAI costs based on tokens and model
export const calculateOpenAICost = (
  inputTokens: number,
  outputTokens: number,
  model: string
): number => {
  // OpenAI pricing per 1K tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  };

  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  
  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
};

// Helper function to calculate Anthropic costs
export const calculateAnthropicCost = (
  inputTokens: number,
  outputTokens: number,
  model: string
): number => {
  // Anthropic pricing per 1K tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 }
  };

  const modelPricing = pricing[model] || pricing['claude-3-haiku'];
  
  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
};