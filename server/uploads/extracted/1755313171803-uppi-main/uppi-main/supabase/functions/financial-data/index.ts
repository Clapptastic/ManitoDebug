import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = 'alphavantage' | 'finnhub';

async function fetchAlphaVantage(symbol: string, apiKey: string) {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'GLOBAL_QUOTE');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  const q = json["Global Quote"] || {};
  return {
    price: Number(q["05. price"]) || undefined,
    change: Number(q["09. change"]) || undefined,
    changePercent: q["10. change percent"] ? Number(q["10. change percent"].replace('%','')) : undefined,
    volume: Number(q["06. volume"]) || undefined,
    provider: 'alphavantage' as Provider
  };
}

async function searchAlphaVantageSymbol(keyword: string, apiKey: string) {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'SYMBOL_SEARCH');
  url.searchParams.set('keywords', keyword);
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  const best = Array.isArray(json?.bestMatches) ? json.bestMatches[0] : undefined;
  if (!best) return undefined;
  return { symbol: best['1. symbol'], name: best['2. name'], exchange: best['4. region'] };
}

async function fetchFinnhub(symbol: string, apiKey: string) {
  const url = new URL('https://finnhub.io/api/v1/quote');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('token', apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  return {
    price: Number(json.c) || undefined,
    change: Number(json.d) || undefined,
    changePercent: Number(json.dp) || undefined,
    provider: 'finnhub' as Provider
  };
}

async function searchFinnhubSymbol(keyword: string, apiKey: string) {
  const url = new URL('https://finnhub.io/api/v1/search');
  url.searchParams.set('q', keyword);
  url.searchParams.set('token', apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  const best = Array.isArray(json?.result) ? json.result.find((r: any) => r.type === 'Common Stock') || json.result[0] : undefined;
  if (!best) return undefined;
  return { symbol: best.symbol, name: best.description, exchange: best.exchange };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId, companyName, stockSymbol } = await req.json();
    if (!analysisId || (!companyName && !stockSymbol)) {
      return new Response(JSON.stringify({ error: 'analysisId and (companyName or stockSymbol) are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve user id
    const { data: analysis, error: analysisErr } = await supabase
      .from('competitor_analyses')
      .select('id, user_id, name, stock_symbol, exchange')
      .eq('id', analysisId)
      .maybeSingle();

    if (analysisErr || !analysis) {
      return new Response(JSON.stringify({ error: analysisErr?.message || 'Analysis not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = analysis.user_id as string;

    // Try Alpha Vantage first (free‑first)
    let providerUsed: Provider | undefined;
    let symbol = stockSymbol;
    let exchange: string | undefined;
    let priceData: any;

    // Get Alpha Vantage key
    const { data: avKeyRow } = await supabase.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: userId,
      provider_param: 'alphavantage'
    });

    if (!symbol && avKeyRow?.api_key) {
      const s = await searchAlphaVantageSymbol(companyName || analysis.name, avKeyRow.api_key);
      if (s?.symbol) {
        symbol = s.symbol;
        exchange = s.exchange;
      }
    }

    if (symbol && avKeyRow?.api_key) {
      priceData = await fetchAlphaVantage(symbol, avKeyRow.api_key);
      providerUsed = 'alphavantage';
    }

    // Fallback to Finnhub
    if ((!priceData || !priceData.price) ) {
      const { data: fhKeyRow } = await supabase.rpc('manage_api_key', {
        operation: 'get_for_decryption',
        user_id_param: userId,
        provider_param: 'finnhub'
      });

      if (!symbol && fhKeyRow?.api_key) {
        const s2 = await searchFinnhubSymbol(companyName || analysis.name, fhKeyRow.api_key);
        if (s2?.symbol) {
          symbol = s2.symbol;
          exchange = s2.exchange;
        }
      }

      if (symbol && fhKeyRow?.api_key) {
        priceData = await fetchFinnhub(symbol, fhKeyRow.api_key);
        providerUsed = 'finnhub';
      }
    }

    if (!priceData || !priceData.price) {
      return new Response(JSON.stringify({ error: 'Unable to resolve public stock data from free providers' }), { status: 424, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Persist to analysis
    await supabase
      .from('competitor_analyses')
      .update({
        financial_data: {
          stock_price: priceData.price,
          volume: priceData.volume,
          day_change: priceData.change,
          day_change_percent: priceData.changePercent,
          last_updated: new Date().toISOString()
        },
        stock_symbol: symbol,
        exchange: exchange || analysis.exchange || null,
        is_public_company: true
      })
      .eq('id', analysisId);

    // Track cost (assume free tier requests)
    await supabase.from('api_usage_costs').insert({
      user_id: userId,
      provider: providerUsed,
      service: 'financial',
      endpoint: providerUsed === 'alphavantage' ? '/query' : '/quote',
      usage_count: 1,
      cost_usd: 0,
      response_time_ms: null,
      analysis_id: analysisId,
      operation_type: 'financial_fetch',
      metadata: { symbol, companyName }
    });

    return new Response(
      JSON.stringify({ success: true, provider: providerUsed, symbol, price: priceData.price }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('financial-data error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
