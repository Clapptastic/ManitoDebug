import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  error?: any;
  context?: any;
  environment?: string;
  version?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
  requestId?: string;
  performance?: any;
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

    if (req.method === 'POST') {
      const logEntry: LogEntry = await req.json();

      // Validate log entry
      if (!logEntry.timestamp || !logEntry.level || !logEntry.message) {
        console.error('Invalid log entry:', logEntry);
        return new Response(
          JSON.stringify({ error: 'Invalid log entry format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Enhanced log processing
      const processedLog = {
        ...logEntry,
        id: crypto.randomUUID(),
        server_timestamp: new Date().toISOString(),
        source: 'client',
        processed: true
      };

      // Log to console for immediate visibility (Lovable AI will see this)
      const logLevel = logEntry.level.toLowerCase();
      const consoleMethod = logLevel === 'error' || logLevel === 'fatal' ? 'error' :
                           logLevel === 'warn' ? 'warn' : 'log';
      
      console[consoleMethod](`[CLIENT_LOG] ${logEntry.level}: ${logEntry.message}`, {
        timestamp: logEntry.timestamp,
        userId: logEntry.userId,
        route: logEntry.route,
        component: logEntry.component,
        data: logEntry.data,
        error: logEntry.error
      });

      // Store in database for persistence and analysis
      const { error: dbError } = await supabase
        .from('application_logs')
        .insert(processedLog);

      if (dbError) {
        console.error('Failed to store log in database:', dbError);
        // Don't fail the response - logging should be non-blocking
      }

      // Real-time error alerting for critical issues
      if (logEntry.level === 'FATAL' || logEntry.level === 'ERROR') {
        await handleCriticalError(supabase, processedLog);
      }

      // Performance monitoring
      if (logEntry.performance?.duration > 5000) {
        console.warn('PERFORMANCE_ALERT: Slow operation detected', {
          operation: logEntry.message,
          duration: logEntry.performance.duration,
          route: logEntry.route,
          component: logEntry.component
        });
      }

      return new Response(
        JSON.stringify({ success: true, logId: processedLog.id }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // GET endpoint for retrieving logs (for debugging)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const level = url.searchParams.get('level');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const userId = url.searchParams.get('userId');

      let query = supabase
        .from('application_logs')
        .select('*')
        .order('server_timestamp', { ascending: false })
        .limit(limit);

      if (level) {
        query = query.eq('level', level.toUpperCase());
      }

      if (userId) {
        query = query.eq('userId', userId);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.error('Failed to retrieve logs:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve logs' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ logs }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in log-api function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleCriticalError(supabase: any, logEntry: any) {
  try {
    // Store critical errors in separate table for immediate attention
    await supabase
      .from('critical_errors')
      .insert({
        log_id: logEntry.id,
        error_type: logEntry.error?.name || 'Unknown',
        error_message: logEntry.error?.message || logEntry.message,
        stack_trace: logEntry.error?.stack,
        user_id: logEntry.userId,
        route: logEntry.route,
        component: logEntry.component,
        timestamp: logEntry.timestamp,
        context: logEntry.context || logEntry.data,
        severity: logEntry.level,
        resolved: false
      });

    // Log alert for immediate visibility
    console.error('CRITICAL_ERROR_ALERT:', {
      errorId: logEntry.id,
      message: logEntry.message,
      userId: logEntry.userId,
      route: logEntry.route,
      timestamp: logEntry.timestamp
    });

  } catch (alertError) {
    console.error('Failed to handle critical error alert:', alertError);
  }
}