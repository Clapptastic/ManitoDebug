import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from '../shared/supabase-admin.ts';
import { logInfo, logError } from '../shared/logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Secure system health check function using RPC calls
 * Replaces direct admin table access to prevent permission errors
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();
    
    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    logInfo('Checking system health', { userId: user.id });

    // Use secure RPC function instead of direct table access
    const { data: healthData, error: rpcError } = await supabase
      .rpc('get_system_health_safe');

    if (rpcError) {
      logError(rpcError, 'System health check failed');
      throw rpcError;
    }

    // Additional health checks
    const healthChecks = {
      database: true,
      auth: !!user,
      timestamp: new Date().toISOString(),
      ...healthData
    };

    logInfo('System health check completed', { 
      userId: user.id,
      status: healthChecks.system_status
    });

    return new Response(JSON.stringify({
      success: true,
      data: healthChecks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logError(error, 'System health check failed');
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'System health check failed',
      data: {
        database: false,
        auth: false,
        system_status: 'error',
        timestamp: new Date().toISOString()
      }
    }), {
      status: error.message.includes('Authorization') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});