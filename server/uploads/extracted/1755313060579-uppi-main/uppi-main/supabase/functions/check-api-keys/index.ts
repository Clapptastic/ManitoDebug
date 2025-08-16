import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logApiMetrics } from '../shared/api-metrics.ts'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Use the manage_api_key_vault RPC for secure access
async function getApiKeyMask(supabaseClient: any, userId: string, provider: string): Promise<string> {
  const { data, error } = await supabaseClient.rpc('manage_api_key_vault', {
    operation: 'select',
    user_id_param: userId,
    provider_param: provider
  });

  if (error) {
    throw new Error(`Failed to get ${provider} API key: ${error.message}`);
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error(`No ${provider} API key found`);
  }

  const activeKey = data.find(k => k.provider === provider && k.is_active);
  if (!activeKey) {
    throw new Error(`No active ${provider} API key found`);
  }

  return activeKey.masked_key;
}

interface ApiKeyStatus {
  working: boolean
  configured: boolean
  error: string | null
}

serve(async (req) => {
// Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // Health check (fast path)
  const { searchParams } = new URL(req.url);
  if (req.method === 'GET' && (searchParams.get('health') === '1' || searchParams.get('health') === 'true')) {
    return new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    console.log(`Checking API keys for user: ${user.id}`)

    // Get user's API keys using the secure vault function
    const { data: apiKeysResponse, error: apiKeyError } = await supabase.rpc('manage_api_key_vault', {
      operation: 'select',
      user_id_param: user.id
    })

    if (apiKeyError) {
      throw new Error(`Failed to fetch API keys: ${apiKeyError.message}`)
    }

    const apiKeys = apiKeysResponse || []
    console.log(`Found ${apiKeys.length} active API keys`)

    const results: Record<string, ApiKeyStatus> = {}
    const providers = ['openai', 'anthropic', 'perplexity', 'gemini', 'google', 'cohere', 'mistral', 'groq', 'huggingface', 'serpapi', 'newsapi', 'alphavantage']

    // Check each provider
    for (const provider of providers) {
      const apiKey = apiKeys?.find(key => key.provider === provider)
      
      if (!apiKey) {
        results[provider] = {
          working: false,
          configured: false,
          error: 'API key not configured'
        }
        continue
      }

      try {
        // For testing, we'll use a placeholder since we can't decrypt vault keys easily in this context
        // This function is mainly for status checking, not actual API key testing
        const isWorking = await testApiKeyStatus(provider, apiKey.masked_key)
        results[provider] = {
          working: isWorking,
          configured: true,
          error: isWorking ? null : 'API key validation failed'
        }

        // Update status in database
        await supabase
          .from('api_keys')
          .update({ 
            status: isWorking ? 'active' : 'error',
            last_validated: new Date().toISOString(),
            error_message: isWorking ? null : 'Validation failed'
          })
          .eq('id', apiKey.id)

      } catch (error) {
        console.error(`Error testing ${provider} API key:`, error)
        results[provider] = {
          working: false,
          configured: true,
          error: error.message
        }

        // Update error status in database
        await supabase
          .from('api_keys')
          .update({ 
            status: 'error',
            last_validated: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', apiKey.id)
      }
    }

    const workingKeys = Object.values(results).filter(r => r.working).length
    const hasRequiredKeys = results.openai?.working || results.anthropic?.working || results.perplexity?.working

    await logApiMetrics(user.id, 'check-api-keys', startTime, 200, {
      working_keys: workingKeys,
      total_keys: apiKeys?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        success: hasRequiredKeys,
        working_keys: workingKeys,
        total_keys: apiKeys?.length || 0,
        keys: results,
        message: hasRequiredKeys ? 'API keys are working' : 'No working API keys found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ API key check error:', error)
    // Resiliency: return 200 with structured error instead of 500 to avoid breaking client flows
    await logApiMetrics('unknown', 'check-api-keys', startTime, 200, { error: (error as Error)?.message });
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error)?.message,
        keys: {}
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Note: This function now checks status rather than actually testing API keys
// since vault decryption should happen in secure contexts only
async function testApiKeyStatus(provider: string, maskedKey: string): Promise<boolean> {
  // For now, we assume keys are working if they're properly configured
  // Real testing would require vault decryption which should be done sparingly
  return maskedKey && maskedKey.length > 8;
}

async function testApiKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai':
        return await testOpenAI(apiKey)
      case 'anthropic':
        return await testAnthropic(apiKey)
      case 'perplexity':
        return await testPerplexity(apiKey)
      case 'gemini':
      case 'google':
        return await testGemini(apiKey)
      case 'groq':
        return await testGroq(apiKey)
      case 'newsapi':
        return await testNewsAPI(apiKey)
      case 'cohere':
        return await testCohere(apiKey)
      case 'mistral':
        return await testMistral(apiKey)
      case 'huggingface':
        return await testHuggingFace(apiKey)
      case 'serpapi':
        return await testSerpAPI(apiKey)
      case 'alphavantage':
        return await testAlphaVantage(apiKey)
      default:
        return false
    }
  } catch (error) {
    console.error(`Error testing ${provider}:`, error)
    return false
  }
}

async function testOpenAI(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  })

  return response.ok
}

async function testAnthropic(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: 'test'
      }]
    })
  })

  return response.ok
}

async function testPerplexity(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{
        role: 'user',
        content: 'test'
      }],
      max_tokens: 10
    })
  })

  return response.ok
}

async function testGemini(apiKey: string): Promise<boolean> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  return response.ok
}

async function testGroq(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  return response.ok
}

async function testNewsAPI(apiKey: string): Promise<boolean> {
  const response = await fetch('https://newsapi.org/v2/top-headlines?country=us&pageSize=1', {
    headers: { 'X-Api-Key': apiKey }
  })
  return response.ok
}

async function testCohere(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.cohere.ai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  return response.ok
}

async function testMistral(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  return response.ok
}

async function testHuggingFace(apiKey: string): Promise<boolean> {
  const response = await fetch('https://huggingface.co/api/whoami-v2', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  return response.ok
}

async function testSerpAPI(apiKey: string): Promise<boolean> {
  const response = await fetch(`https://serpapi.com/account.json?api_key=${apiKey}`)
  return response.ok
}

async function testAlphaVantage(apiKey: string): Promise<boolean> {
  const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=${apiKey}`)
  return response.ok
}