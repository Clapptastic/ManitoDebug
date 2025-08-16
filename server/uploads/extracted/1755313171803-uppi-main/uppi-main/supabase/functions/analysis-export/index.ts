// Supabase Edge Function: analysis-export
// Generates JSON/CSV exports for a competitor analysis, authenticated per user
// Note: PDF generation remains client-side due to rendering constraints in edge runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequestBody {
  analysisId: string;
  format: 'json' | 'csv';
}

// Utility: CSV safe wrapping
function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

function buildCsv(analysis: Record<string, any>): string {
  const rows: Array<[string, string]> = [];
  const push = (label: string, val: unknown) => rows.push([label, String(val ?? '')]);

  push('Company Name', analysis.name);
  push('Description', analysis.description);
  push('Website URL', analysis.website_url);
  push('Industry', analysis.industry);
  push('Founded Year', analysis.founded_year);
  push('Headquarters', analysis.headquarters);
  push('Employee Count', analysis.employee_count);
  push('Business Model', analysis.business_model);
  push('Market Position', analysis.market_position);
  push('Revenue Estimate', analysis.revenue_estimate);
  push('Market Share Estimate (%)', analysis.market_share_estimate);
  push('Strengths', Array.isArray(analysis.strengths) ? analysis.strengths.join('; ') : analysis.strengths);
  push('Weaknesses', Array.isArray(analysis.weaknesses) ? analysis.weaknesses.join('; ') : analysis.weaknesses);
  push('Opportunities', Array.isArray(analysis.opportunities) ? analysis.opportunities.join('; ') : analysis.opportunities);
  push('Threats', Array.isArray(analysis.threats) ? analysis.threats.join('; ') : analysis.threats);
  push('Competitive Advantages', Array.isArray(analysis.competitive_advantages) ? analysis.competitive_advantages.join('; ') : analysis.competitive_advantages);
  push('Competitive Disadvantages', Array.isArray(analysis.competitive_disadvantages) ? analysis.competitive_disadvantages.join('; ') : analysis.competitive_disadvantages);
  push('Overall Threat Level', analysis.overall_threat_level);
  push('Data Quality Score', analysis.data_quality_score);
  push('Data Completeness Score', analysis.data_completeness_score);
  push('Innovation Score', analysis.innovation_score);
  push('Brand Strength Score', analysis.brand_strength_score);
  push('Market Sentiment Score', analysis.market_sentiment_score);
  push('Patent Count', analysis.patent_count);
  push('Target Markets', Array.isArray(analysis.target_market) ? analysis.target_market.join('; ') : analysis.target_market);
  push('Customer Segments', Array.isArray(analysis.customer_segments) ? analysis.customer_segments.join('; ') : analysis.customer_segments);
  push('Geographic Presence', Array.isArray(analysis.geographic_presence) ? analysis.geographic_presence.join('; ') : analysis.geographic_presence);
  push('Partnerships', Array.isArray(analysis.partnerships) ? analysis.partnerships.join('; ') : analysis.partnerships);
  push('Status', analysis.status);
  push('Created At', analysis.created_at);
  push('Updated At', analysis.updated_at);
  push('Completed At', analysis.completed_at);

  const header = ['Field', 'Value'];
  const lines = [header.map(csvEscape).join(','), ...rows.map(([k, v]) => [csvEscape(k), csvEscape(v)].join(','))];
  return lines.join('\n');
}

function toBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ success: false, message: 'Supabase env not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body: ExportRequestBody = await req.json();
    const { analysisId, format } = body;

    if (!analysisId || !['json', 'csv'].includes(format)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Ensure the user is authenticated and fetch the analysis scoped to the user
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data, error } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('DB error fetching analysis:', error);
      return new Response(JSON.stringify({ success: false, message: 'Failed to fetch analysis' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ success: false, message: 'Analysis not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const fileSafeName = String(data.name || 'analysis').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'json') {
      const payload = { ...data, exportedAt: new Date().toISOString() };
      const jsonText = JSON.stringify(payload, null, 2);
      return new Response(
        JSON.stringify({ success: true, filename: `${fileSafeName}_analysis.json`, mimeType: 'application/json', base64: toBase64(jsonText) }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // CSV
    const csvText = buildCsv(data as Record<string, any>);
    return new Response(
      JSON.stringify({ success: true, filename: `${fileSafeName}_analysis.csv`, mimeType: 'text/csv;charset=utf-8', base64: toBase64(csvText) }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('analysis-export error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
