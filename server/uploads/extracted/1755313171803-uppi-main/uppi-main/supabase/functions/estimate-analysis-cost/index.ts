import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { logApiMetrics } from '../shared/api-metrics.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CostEstimateRequest {
  competitors: string[];
  analysisType?: 'basic' | 'comprehensive' | 'deep';
  providers?: string[];
}

interface CostEstimate {
  totalEstimate: number;
  breakdown: {
    provider: string;
    estimatedCost: number;
    tokensEstimate: number;
    confidence: number;
  }[];
  factors: {
    competitorCount: number;
    analysisType: string;
    providersUsed: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      await logApiMetrics('unknown', 'estimate-analysis-cost', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: CostEstimateRequest;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      await logApiMetrics(user.id, 'estimate-analysis-cost', startTime, 400);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.competitors || body.competitors.length === 0) {
      await logApiMetrics(user.id, 'estimate-analysis-cost', startTime, 400);
      return new Response(
        JSON.stringify({ error: 'Competitors list is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active API keys to determine available providers
    const { data: apiKeys } = await supabaseClient
      .from('api_keys')
      .select('provider, status, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('status', 'active');

    const availableProviders = apiKeys?.map(key => key.provider) || [];
    const providersToUse = body.providers?.filter(p => availableProviders.includes(p)) || availableProviders;

    // Base cost estimates per provider (in USD)
    const providerCosts = {
      'openai': { baseTokens: 2000, costPer1kTokens: 0.002 },
      'anthropic': { baseTokens: 2500, costPer1kTokens: 0.008 },
      'gemini': { baseTokens: 1800, costPer1kTokens: 0.001 },
      'perplexity': { baseTokens: 2200, costPer1kTokens: 0.002 },
      'mistral': { baseTokens: 2000, costPer1kTokens: 0.0015 }
    };

    // Analysis complexity multipliers
    const complexityMultipliers = {
      'basic': 1.0,
      'comprehensive': 1.8,
      'deep': 2.5
    };

    const analysisType = body.analysisType || 'comprehensive';
    const multiplier = complexityMultipliers[analysisType] || 1.8;
    const competitorCount = body.competitors.length;

    // Calculate estimates for each provider
    const breakdown = providersToUse.map(provider => {
      const providerConfig = providerCosts[provider as keyof typeof providerCosts];
      if (!providerConfig) {
        return {
          provider,
          estimatedCost: 0.25 * competitorCount * multiplier,
          tokensEstimate: 2000 * competitorCount * multiplier,
          confidence: 0.6
        };
      }

      const tokensEstimate = providerConfig.baseTokens * competitorCount * multiplier;
      const estimatedCost = (tokensEstimate / 1000) * providerConfig.costPer1kTokens;

      return {
        provider,
        estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimal places
        tokensEstimate: Math.round(tokensEstimate),
        confidence: 0.85
      };
    });

    const totalEstimate = breakdown.reduce((sum, item) => sum + item.estimatedCost, 0);

    const estimate: CostEstimate = {
      totalEstimate: Math.round(totalEstimate * 100) / 100,
      breakdown,
      factors: {
        competitorCount,
        analysisType,
        providersUsed: providersToUse.length
      }
    };

    await logApiMetrics(user.id, 'estimate-analysis-cost', startTime, 200);
    return new Response(
      JSON.stringify({ 
        success: true,
        estimate
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error estimating analysis cost:', error);
    await logApiMetrics('unknown', 'estimate-analysis-cost', startTime, 500);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})