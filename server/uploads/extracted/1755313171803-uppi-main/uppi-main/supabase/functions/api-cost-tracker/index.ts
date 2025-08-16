import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, service, endpoint, cost_usd = 0, usage_count = 1, response_time_ms, analysis_id, operation_type, metadata, user_id } = await req.json();

    if (!provider || !service || !endpoint) {
      return new Response(JSON.stringify({ error: "provider, service, and endpoint are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate request (Edge functions verify JWT by default, but we also fetch user for role checks)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id_param: user.id });
    const isAdminRole = roleData === 'admin' || roleData === 'super_admin';

    // If user_id not provided, attempt to infer from analysis
    let resolvedUserId = user_id as string | undefined;
    if (!resolvedUserId && analysis_id) {
      const { data: a } = await supabase.from("competitor_analyses").select("user_id").eq("id", analysis_id).maybeSingle();
      resolvedUserId = a?.user_id as string | undefined;
    }

    // Permission: user can only write their own usage unless admin
    if (resolvedUserId && resolvedUserId !== user.id && !isAdminRole) {
      return new Response(JSON.stringify({ error: "Forbidden: cannot write costs for another user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Enforce per-user monthly cost limits before recording
    const projected = typeof cost_usd === 'number' ? cost_usd : 0;
    if (resolvedUserId) {
      const { data: costCheck, error: ccErr } = await supabase.rpc('check_user_cost_allowed', {
        user_id_param: resolvedUserId,
        projected_cost_param: projected
      });
      if (ccErr) {
        return new Response(JSON.stringify({ error: ccErr.message || 'Cost check failed' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (costCheck && costCheck.allowed === false) {
        return new Response(JSON.stringify({ error: "Monthly cost limit exceeded", details: costCheck }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const insertRes = await supabase.from("api_usage_costs").insert({
      user_id: resolvedUserId,
      provider,
      service,
      endpoint,
      usage_count,
      cost_usd,
      response_time_ms,
      analysis_id: analysis_id ?? null,
      operation_type: operation_type ?? null,
      metadata: metadata ?? {},
    });

    if (insertRes.error) {
      return new Response(JSON.stringify({ error: insertRes.error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Optionally update competitor_analyses running total
    if (analysis_id && typeof cost_usd === "number") {
      await supabase
        .from("competitor_analyses")
        .update({ total_api_cost: (await (async () => {
          const { data } = await supabase.from("api_usage_costs").select("cost_usd").eq("analysis_id", analysis_id);
          const total = (data || []).reduce((sum: number, r: any) => sum + Number(r.cost_usd || 0), 0);
          return total;
        })()) })
        .eq("id", analysis_id);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("api-cost-tracker error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
