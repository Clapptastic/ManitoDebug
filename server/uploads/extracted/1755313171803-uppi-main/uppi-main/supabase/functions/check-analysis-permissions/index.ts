import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { logApiMetrics } from '../shared/api-metrics.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PermissionCheckRequest {
  analysisType?: string;
  competitorCount?: number;
  userId?: string;
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
      await logApiMetrics('unknown', 'check-analysis-permissions', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: PermissionCheckRequest = {};
    try {
      const rawBody = await req.text();
      if (rawBody && rawBody.trim()) {
        body = JSON.parse(rawBody);
      }
    } catch (parseError) {
      console.error('Body parsing error:', parseError);
    }

    // Check user's monthly usage and limits
    const { data: costData } = await supabaseClient.rpc('check_user_cost_allowed', {
      user_id_param: user.id,
      projected_cost_param: (body.competitorCount || 1) * 0.25 // Estimate $0.25 per competitor
    });

    if (!costData?.allowed) {
      await logApiMetrics(user.id, 'check-analysis-permissions', startTime, 429);
      return new Response(
        JSON.stringify({ 
          error: 'Usage limit exceeded',
          details: {
            monthlySpend: costData?.monthly_spend || 0,
            monthlyLimit: costData?.monthly_limit || 10,
            remaining: costData?.remaining || 0
          }
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has any active API keys
    const { data: apiKeys } = await supabaseClient
      .from('api_keys')
      .select('provider, status, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('status', 'active');

    const hasActiveKeys = apiKeys && apiKeys.length > 0;

    // Check user's plan/subscription if needed
    const { data: subscription } = await supabaseClient
      .from('billing_subscriptions')
      .select('status, plan_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const permissions = {
      canAnalyze: hasActiveKeys && costData?.allowed,
      hasActiveApiKeys: hasActiveKeys,
      activeKeyCount: apiKeys?.length || 0,
      costAllowed: costData?.allowed || false,
      monthlySpend: costData?.monthly_spend || 0,
      monthlyLimit: costData?.monthly_limit || 10,
      remaining: costData?.remaining || 0,
      planType: subscription?.plan_id || 'free',
      estimatedCost: (body.competitorCount || 1) * 0.25
    };

    await logApiMetrics(user.id, 'check-analysis-permissions', startTime, 200);
    return new Response(
      JSON.stringify({ 
        success: true,
        permissions
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking analysis permissions:', error);
    await logApiMetrics('unknown', 'check-analysis-permissions', startTime, 500);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})