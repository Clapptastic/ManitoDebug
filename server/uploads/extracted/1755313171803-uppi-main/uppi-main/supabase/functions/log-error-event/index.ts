// Edge function: log-error-event
// Accepts error events from frontend and inserts into public.error_events

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../shared/cors.ts";
import { handleApiError } from "../shared/error-handling.ts";

interface ErrorEventPayload {
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'critical' | 'low' | 'medium' | 'high';
  error_type?: string;
  source?: string; // e.g., 'frontend', 'edge:function-name'
  component?: string;
  route?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  url?: string;
  user_agent?: string;
}

function normalizeSeverity(sev?: string): 'info' | 'warning' | 'error' | 'critical' {
  const s = (sev || 'error').toLowerCase();
  if (s === 'low' || s === 'info') return 'info';
  if (s === 'medium' || s === 'warning') return 'warning';
  if (s === 'high' || s === 'error') return 'error';
  return 'critical';
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health ping
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true, message: 'ok', timestamp: new Date().toISOString() }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const start = Date.now();
  try {
    // Create admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get auth user (if any)
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    let userId: string | null = null;
    if (jwt) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(jwt);
        userId = data.user?.id ?? null;
      } catch (_) {
        // ignore
      }
    }

    const ua = req.headers.get('user-agent') || undefined;
    const referer = req.headers.get('referer') || undefined;

    let body: ErrorEventPayload | undefined;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!body?.message) {
      return new Response(JSON.stringify({ error: 'Missing required field: message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = {
      user_id: userId,
      session_id: body.session_id ?? null,
      source: body.source || 'frontend',
      component: body.component ?? null,
      route: body.route ?? null,
      error_type: body.error_type ?? null,
      severity: normalizeSeverity(body.severity),
      message: body.message,
      stack: body.stack ?? null,
      metadata: body.metadata ?? {},
      user_agent: body.user_agent || ua || null,
      url: body.url || referer || null,
    };

    const { error } = await supabaseAdmin
      .from('error_events')
      .insert(payload);

    if (error) {
      console.error('Database insert error:', error);
      return new Response(JSON.stringify({ 
        error: error.message, 
        details: error.details || 'Failed to insert error event',
        code: error.code || 'unknown'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true, elapsed_ms: Date.now() - start }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return handleApiError(err);
  }
});
