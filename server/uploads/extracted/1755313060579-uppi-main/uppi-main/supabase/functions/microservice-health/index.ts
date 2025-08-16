import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { serviceUrl, healthCheckPath = '/health' } = await req.json();

    if (!serviceUrl) {
      return new Response(
        JSON.stringify({ error: 'Service URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Checking health for service: ${serviceUrl}${healthCheckPath}`);

    const startTime = Date.now();
    let status = 'unhealthy';
    let responseTime = 0;
    let errorMessage = null;

    try {
      // Attempt to fetch the health endpoint
      const healthResponse = await fetch(`${serviceUrl}${healthCheckPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      responseTime = Date.now() - startTime;

      if (healthResponse.ok) {
        status = 'healthy';
        console.log(`Service ${serviceUrl} is healthy (${responseTime}ms)`);
      } else {
        status = 'unhealthy';
        errorMessage = `HTTP ${healthResponse.status}: ${healthResponse.statusText}`;
        console.log(`Service ${serviceUrl} returned error: ${errorMessage}`);
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      status = 'unhealthy';
      errorMessage = error.message;
      console.error(`Health check failed for ${serviceUrl}:`, error);
    }

    // Log the health check result to edge function metrics
    try {
      await supabase.from('edge_function_metrics').insert({
        function_name: 'microservice-health',
        status: status === 'healthy' ? 'success' : 'error',
        execution_time_ms: responseTime,
        error_message: errorMessage,
        timestamp: new Date().toISOString()
      });
    } catch (metricsError) {
      console.error('Failed to log metrics (legacy table):', metricsError);
      // Don't fail the health check if metrics logging fails
    }

    // Also log to consolidated api_metrics table
    try {
      const requestId = crypto.randomUUID();
      await supabase.from('api_metrics').insert({
        user_id: null,
        endpoint: `${serviceUrl}${healthCheckPath}`,
        method: 'GET',
        status_code: status === 'healthy' ? 200 : 503,
        response_time_ms: responseTime,
        metadata: {
          provider: 'microservice-health',
          error_message: errorMessage,
          request_id: requestId
        }
      });
    } catch (metricsError2) {
      console.error('Failed to log consolidated api_metrics:', metricsError2);
    }


    return new Response(
      JSON.stringify({
        status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        serviceUrl,
        healthCheckPath,
        ...(errorMessage && { error: errorMessage })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})