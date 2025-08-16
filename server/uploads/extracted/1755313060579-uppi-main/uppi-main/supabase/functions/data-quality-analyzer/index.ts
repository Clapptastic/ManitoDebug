import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SourceEvidence {
  source: string;             // e.g., 'crunchbase', 'newsapi', 'openai'
  reliability: number;        // w_s in [0,1]
  freshnessDays: number;      // age in days
  verification: number;       // V_s in [0,1]
  agreement: number;          // G_s in [0,1]
}

interface FactInput {
  field: string;              // e.g., 'employee_count'
  value: unknown;
  sources: SourceEvidence[];
  aiConsensus?: number;       // C_A in [0,1]
}

function freshnessFactor(ageDays: number, halfLifeDays: number): number {
  const h = Math.max(0.001, halfLifeDays);
  return Math.exp(-Math.log(2) * Math.max(0, ageDays) / h);
}

function halfLifeForField(field: string): number {
  if (/price|stock/i.test(field)) return 0.02;
  if (/market_cap|pe|pe_ratio|volume/i.test(field)) return 2;
  if (/funding|round/i.test(field)) return 365;
  if (/founded|headquarters|hq|industry|sector/i.test(field)) return 730;
  if (/news|sentiment/i.test(field)) return 14;
  return 90;
}

function computeTrustScore(fact: FactInput) {
  const lambda = 0.15; // consensus bonus weight
  const HL = halfLifeForField(fact.field);

  let E = 0; // aggregate evidence
  for (const s of fact.sources) {
    const F = freshnessFactor(s.freshnessDays, HL);
    const Es = (s.reliability || 0) * F * (s.verification || 0) * (s.agreement || 0);
    E += Es;
  }

  const Z = 1.5; // calibration constant (tunable; empirical 95th percentile proxy)
  const CA = Math.min(1, Math.max(0, fact.aiConsensus ?? 0));
  const BA = 1 + lambda * CA;
  const raw = Math.min(100, 100 * (E / Z) * BA);

  let tier: 'high' | 'medium' | 'low' = 'low';
  if (raw >= 85) tier = 'high'; else if (raw >= 70) tier = 'medium';

  return { score: Number(raw.toFixed(2)), tier, components: { E, Z, BA, CA, lambda, HL } };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId, facts } = await req.json();
    if (!analysisId || !Array.isArray(facts)) {
      return new Response(JSON.stringify({ error: 'analysisId and facts[] are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate request and load role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id_param: user.id });
    const isAdminRole = roleData === 'admin' || roleData === 'super_admin';

    // Resolve user for cost logging
    const { data: analysis } = await supabase
      .from('competitor_analyses')
      .select('user_id')
      .eq('id', analysisId)
      .maybeSingle();

    // Permission: only owner of analysis or admin may update
    if (analysis?.user_id && analysis.user_id !== user.id && !isAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: cannot update another user\'s analysis' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = facts.map((f: FactInput) => ({
      field: f.field,
      value: f.value,
      trust: computeTrustScore(f),
      sources: f.sources
    }));

    // Aggregate into breakdown for convenience
    const overall = Number((results.reduce((sum: number, r: any) => sum + r.trust.score, 0) / Math.max(1, results.length)).toFixed(2));

    await supabase
      .from('competitor_analyses')
      .update({ data_quality_breakdown: { overall_score: overall, fields: results } })
      .eq('id', analysisId);

    // Optionally store per-metric rows (kept minimal here)
    // Track zero-cost compute
    if (analysis?.user_id) {
      await supabase.from('api_usage_costs').insert({
        user_id: analysis.user_id,
        provider: 'internal',
        service: 'quality',
        endpoint: 'data-quality-analyzer',
        usage_count: 1,
        cost_usd: 0,
        analysis_id: analysisId,
        operation_type: 'quality_score'
      });
    }

    return new Response(JSON.stringify({ success: true, overall, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('data-quality-analyzer error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
