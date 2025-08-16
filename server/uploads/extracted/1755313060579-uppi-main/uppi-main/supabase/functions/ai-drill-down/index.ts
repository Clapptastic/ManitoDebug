import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = 'openai' | 'anthropic' | 'gemini' | 'perplexity';

async function callOpenAI(apiKey: string, model: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are a concise business analyst with access to comprehensive data sources. When providing analysis, always cite your sources with specific URLs when available. Return clear, short answers with proper source attribution using the format: [Source: Name - URL].' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  const usage = json?.usage || {};
  return { content, usage };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId, category, specificArea, userPrompt, aiProvider = 'openai', model } = await req.json();
    if (!analysisId || !userPrompt) {
      return new Response(JSON.stringify({ error: 'analysisId and userPrompt are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: analysis, error: analysisErr } = await supabase
      .from('competitor_analyses')
      .select('id, user_id, name, analysis_data')
      .eq('id', analysisId)
      .maybeSingle();

    if (analysisErr || !analysis) {
      return new Response(JSON.stringify({ error: analysisErr?.message || 'Analysis not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = analysis.user_id as string;

    // retrieve user-specific key for provider using vault system
    const { data: vaultKeys, error: keyErr } = await supabase.rpc('manage_api_key_vault', {
      operation: 'select',
      user_id_param: userId,
      provider_param: aiProvider
    });

    if (keyErr || !vaultKeys || !Array.isArray(vaultKeys) || vaultKeys.length === 0) {
      return new Response(JSON.stringify({ error: `${aiProvider} API key not configured` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const context = typeof analysis.analysis_data === 'object' ? JSON.stringify(analysis.analysis_data).slice(0, 4000) : '';
    const fullPrompt = `${userPrompt}\n\nContext (truncated): ${context}`;

    let resultContent = '';
    let tokensIn = 0, tokensOut = 0;

    if (aiProvider === 'openai') {
      // Get decrypted API key from vault
      const activeKey = vaultKeys.find(k => k.provider === 'openai' && k.is_active)
      if (!activeKey) {
        throw new Error('No active OpenAI API key found')
      }

      const { data: decryptedKey, error: decryptError } = await supabase
        .from('vault.secrets')
        .select('decrypted_secret')
        .eq('id', activeKey.vault_secret_id)
        .single()
      
      if (decryptError || !decryptedKey?.decrypted_secret) {
        throw new Error('Failed to decrypt API key')
      }

      const { content, usage } = await callOpenAI(decryptedKey.decrypted_secret, model, fullPrompt);
      resultContent = content;
      tokensIn = Number(usage?.prompt_tokens || 0);
      tokensOut = Number(usage?.completion_tokens || 0);
    } else {
      return new Response(
        JSON.stringify({ error: `${aiProvider} provider not supported yet` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // naive cost estimate (adjust if you maintain pricing table)
    let estimatedCost = 0;
    if (aiProvider === 'openai') {
      // gpt-4.1-2025-04-14: ~$2.50/M input, $10/M output
      estimatedCost = (tokensIn * 0.0000025) + (tokensOut * 0.00001);
    }

    // persist session
    const { data: sessionRow, error: insertErr } = await supabase
      .from('ai_drill_down_sessions')
      .insert({
        analysis_id: analysisId,
        user_id: userId,
        category: category || 'general',
        specific_area: specificArea || null,
        user_prompt: userPrompt,
        ai_response: resultContent,
        provider: aiProvider,
        model: model || null,
        tokens_used: tokensIn + tokensOut,
        cost_usd: Number(estimatedCost.toFixed(6))
      })
      .select('id')
      .maybeSingle();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // track usage
    await supabase.from('api_usage_costs').insert({
      user_id: userId,
      provider: aiProvider,
      service: 'ai',
      endpoint: 'chat.completions',
      usage_count: 1,
      cost_usd: Number(estimatedCost.toFixed(6)),
      analysis_id: analysisId,
      operation_type: 'drill_down',
      metadata: { model: model || 'default', tokensIn, tokensOut }
    });

    return new Response(JSON.stringify({ success: true, sessionId: sessionRow?.id, content: resultContent, estimatedCost }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('ai-drill-down error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
