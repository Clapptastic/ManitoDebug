import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logApiMetrics } from '../shared/api-metrics.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  try {
    let body: any = {};
    try { body = await req.json(); } catch {}

    // Health check short-circuit for diagnostics
    if (body?.healthCheck) {
      await logApiMetrics('unknown', 'validate-api-key', startTime, 200);
      return new Response(
        JSON.stringify({ isValid: false, message: 'ok' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, api_key } = body;


    console.log(`Validating ${provider} API key...`)

    let isValid = false

    switch (provider) {
      case 'openai':
        isValid = await testOpenAI(api_key)
        break
      case 'anthropic':
        isValid = await testAnthropic(api_key)
        break
      case 'google':
        isValid = await testGoogle(api_key)
        break
      case 'perplexity':
        isValid = await testPerplexity(api_key)
        break
      case 'gemini':
        isValid = await testGemini(api_key)
        break
      case 'newsapi':
        isValid = await testNewsAPI(api_key)
        break
      case 'serpapi':
        isValid = await testSerpAPI(api_key)
        break
      case 'mistral':
        isValid = await testMistral(api_key)
        break
      case 'cohere':
        isValid = await testCohere(api_key)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    await logApiMetrics('unknown', 'validate-api-key', startTime, 200);
    return new Response(
      JSON.stringify({ isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error validating API key:', error)
    
    // Provide specific error messages
    let errorMessage = 'API key validation failed';
    if (error instanceof Error) {
      if (error.message.includes('Provider and API key are required')) {
        errorMessage = 'Both provider and API key must be provided';
      } else if (error.message.includes('Unsupported provider')) {
        errorMessage = error.message;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error while validating API key';
      } else {
        errorMessage = error.message || 'Unknown validation error';
      }
    }
    await logApiMetrics('unknown', 'validate-api-key', startTime, 200);
    return new Response(
      JSON.stringify({ 
        isValid: false,
        error: errorMessage
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function testOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    return response.ok
  } catch (error) {
    console.error('OpenAI validation error:', error)
    return false
  }
}

async function testAnthropic(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{
          role: 'user',
          content: 'test'
        }]
      })
    })
    return response.ok
  } catch (error) {
    console.error('Anthropic validation error:', error)
    return false
  }
}

async function testGoogle(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET'
    })
    return response.ok
  } catch (error) {
    console.error('Google validation error:', error)
    return false
  }
}

async function testPerplexity(apiKey: string): Promise<boolean> {
  try {
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
        max_tokens: 1
      })
    })
    return response.ok || response.status === 429 // Accept rate limit as valid
  } catch (error) {
    console.error('Perplexity validation error:', error)
    return false
  }
}

async function testGemini(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET'
    })
    return response.ok
  } catch (error) {
    console.error('Gemini validation error:', error)
    return false
  }
}

async function testNewsAPI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`)
    return response.ok
  } catch (error) {
    console.error('NewsAPI validation error:', error)
    return false
  }
}

async function testSerpAPI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`)
    return response.ok
  } catch (error) {
    console.error('SerpAPI validation error:', error)
    return false
  }
}

async function testMistral(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    return response.ok
  } catch (error) {
    console.error('Mistral validation error:', error)
    return false
  }
}

async function testCohere(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.cohere.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    return response.ok
  } catch (error) {
    console.error('Cohere validation error:', error)
    return false
  }
}