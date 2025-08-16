import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const { searchParams } = new URL(req.url)
  if (req.method === 'GET' && (searchParams.get('health') === '1' || searchParams.get('health') === 'true')) {
    return new Response(
      JSON.stringify({ success: true, message: 'ok' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { sessionId, message, provider = 'openai', model, temperature = 0.7, max_tokens = 1000, context, systemPrompt: incomingSystemPrompt } = await req.json()

  // Normalize provider casing (user may have saved as "OpenAI")
  const normalizedProvider = (provider || 'openai').toString().toLowerCase()

  // Get user from Authorization header (case-insensitive header lookup)
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'auth_missing', message: 'Missing Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'auth_failed', message: 'Authentication failed' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get API key using the secure vault system
  const { data: vaultKeys, error: vaultError } = await supabase.rpc('manage_api_key_vault', {
    operation: 'select',
    user_id_param: user.id,
    provider_param: normalizedProvider
  })

  let apiKey: string | null = null
  if (!vaultError && vaultKeys && Array.isArray(vaultKeys) && vaultKeys.length > 0) {
    // Use first active key for this provider
    const activeKey = vaultKeys.find(k => k.provider === normalizedProvider && k.is_active)
    if (activeKey) {
      // For vault system, we need to decrypt the key
      const { data: decryptedKey, error: decryptError } = await supabase
        .from('vault.secrets')
        .select('decrypted_secret')
        .eq('id', activeKey.vault_secret_id)
        .single()
      
      if (!decryptError && decryptedKey) {
        apiKey = decryptedKey.decrypted_secret
      }
    }
  }

  // Fallback to legacy direct select if vault fails
  if (!apiKey) {
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('masked_key, created_at, provider, is_active')
      .eq('user_id', user.id)
      .ilike('provider', normalizedProvider)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!keyError && apiKeyData && (apiKeyData as any).api_key) {
      apiKey = (apiKeyData as any).api_key as string
    }
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({ 
        error: 'missing_api_key', 
        message: `${normalizedProvider} API key not found for this user. Please add it in Settings > API Keys.`,
        provider: normalizedProvider
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

    // Prepare system prompt (prefer client-provided prompt from prompt-get)
    let systemPrompt = incomingSystemPrompt && typeof incomingSystemPrompt === 'string' && incomingSystemPrompt.trim().length > 0
      ? incomingSystemPrompt
      : `You are an expert AI business advisor with deep knowledge of entrepreneurship, strategy, competitive analysis, and market research. 

You have access to the user's business context and should provide personalized, actionable advice based on their specific situation.

Guidelines:
- Be concise but thorough in your responses
- Provide specific, actionable recommendations
- Reference the user's context when relevant
- Focus on practical business strategy
- Ask clarifying questions when needed
- Maintain a professional but friendly tone`

    if (context && Object.keys(context).length > 0) {
      systemPrompt += `\n\nUser's Business Context:\n`
      
      if (context.company_profile) {
        systemPrompt += `Company: ${context.company_profile.company_name || 'Not specified'}\n`
        systemPrompt += `Industry: ${context.company_profile.industry || 'Not specified'}\n`
        systemPrompt += `Business Model: ${context.company_profile.business_model || 'Not specified'}\n`
      }
      
      if (context.competitor_analyses?.length > 0) {
        systemPrompt += `\n\nRecent Competitor Analyses:\n`
        context.competitor_analyses.slice(0, 3).forEach((analysis: any, i: number) => {
          systemPrompt += `${i + 1}. ${analysis.name} - ${analysis.industry || 'Unknown industry'}\n`
        })
      }
      
      if (context.business_plans?.length > 0) {
        systemPrompt += `\n\nBusiness Plans: ${context.business_plans.length} plan(s) available\n`
      }
      
      if (context.documents?.length > 0) {
        systemPrompt += `\n\nDocuments: ${context.documents.length} document(s) available\n`
      }
    }

    let response
    let tokensUsed = 0
    let cost = 0

    if (normalizedProvider === 'openai') {
      const openaiApiKey = apiKey
      const openaiModel = model || 'gpt-4'
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature,
          max_tokens,
        }),
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        let errorJson: any = null
        try { errorJson = JSON.parse(errorText) } catch {}
        const apiErrCode = errorJson?.error?.code || null
        if (openaiResponse.status === 401 || apiErrCode === 'invalid_api_key') {
          // Mark key invalid
          await supabase.from('api_keys')
            .update({ status: 'invalid', error_message: '401 invalid_api_key', last_validated: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .ilike('provider', normalizedProvider)
            .eq('is_active', true)
          return new Response(
            JSON.stringify({
              error: 'invalid_api_key',
              message: 'OpenAI API key is invalid. Please update it in Settings > API Keys.',
              provider: 'openai'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`)
      }

      const openaiData = await openaiResponse.json()
      response = openaiData.choices[0].message.content
      tokensUsed = openaiData.usage?.total_tokens || 0
      
      // Estimate cost based on model
      const costPerToken = openaiModel.includes('gpt-4') ? 0.00003 : 0.000002
      cost = tokensUsed * costPerToken

      // Mark key validated/used
      await supabase.from('api_keys')
        .update({ status: 'active', error_message: null, last_validated: new Date().toISOString(), last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .ilike('provider', normalizedProvider)
        .eq('is_active', true)

    } else if (normalizedProvider === 'anthropic') {
      const anthropicApiKey = apiKey
      const anthropicModel = model || 'claude-3-sonnet-20240229'
      
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        }),
      })

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text()
        let errJson: any = null
        try { errJson = JSON.parse(errorText) } catch {}
        if (anthropicResponse.status === 401) {
          await supabase.from('api_keys')
            .update({ status: 'invalid', error_message: '401 invalid_api_key', last_validated: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .ilike('provider', normalizedProvider)
            .eq('is_active', true)
          return new Response(
            JSON.stringify({
              error: 'invalid_api_key',
              message: 'Anthropic API key is invalid. Please update it in Settings > API Keys.',
              provider: 'anthropic'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw new Error(`Anthropic API error: ${anthropicResponse.status} ${errorText}`)
      }

      const anthropicData = await anthropicResponse.json()
      response = anthropicData.content[0].text
      tokensUsed = anthropicData.usage?.input_tokens + anthropicData.usage?.output_tokens || 0
      
      // Estimate cost for Claude
      cost = tokensUsed * 0.000008 // Rough estimate

      await supabase.from('api_keys')
        .update({ status: 'active', error_message: null, last_validated: new Date().toISOString(), last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .ilike('provider', normalizedProvider)
        .eq('is_active', true)

    } else {
      throw new Error(`Unsupported provider: ${normalizedProvider}`)
    }

    // Log API usage
    await supabase.from('api_usage_costs').insert({
      user_id: user.id,
      provider: normalizedProvider,
      service: 'chat',
      endpoint: 'chat-completion',
      usage_count: 1,
      cost_usd: cost,
      success: true,
      metadata: {
        model: model || (normalizedProvider === 'openai' ? 'gpt-4' : 'claude-3-sonnet'),
        tokens_used: tokensUsed,
        session_id: sessionId
      }
    })

    return new Response(
      JSON.stringify({
        content: response,
        model: model || (normalizedProvider === 'openai' ? 'gpt-4' : 'claude-3-sonnet'),
        tokens_used: tokensUsed,
        cost,
        context_used: context ? Object.keys(context) : [],
        confidence_score: 0.85
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error('AI Chat error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})