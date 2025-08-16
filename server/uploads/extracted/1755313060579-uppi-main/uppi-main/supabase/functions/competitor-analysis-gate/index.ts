import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GateRequest {
  action: 'check'
  providersSelected?: string[]
}

interface GateResponse {
  can_proceed: boolean
  reasons: string[]
  available_providers: string[]
  missing_keys: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, providersSelected }: GateRequest = await req.json()

    if (action !== 'check') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ can_proceed: false, reasons: ['Authentication required'] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ can_proceed: false, reasons: ['Invalid authentication'] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check available API keys
    const { data: apiKeys, error: apiError } = await supabase
      .from('api_keys')
      .select('provider, status, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .neq('status', 'error')

    if (apiError) {
      console.error('Error fetching API keys:', apiError)
      return new Response(
        JSON.stringify({ can_proceed: false, reasons: ['Failed to check API keys'] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const availableProviders = apiKeys?.map(key => key.provider) || []
    const missingKeys: string[] = []
    const reasons: string[] = []

    // If specific providers requested, check if they're available
    if (providersSelected && providersSelected.length > 0) {
      const unavailableProviders = providersSelected.filter(
        provider => !availableProviders.includes(provider)
      )
      if (unavailableProviders.length > 0) {
        missingKeys.push(...unavailableProviders)
        reasons.push(`Missing API keys: ${unavailableProviders.join(', ')}`)
      }
    }

    // Need at least one working API key
    if (availableProviders.length === 0) {
      reasons.push('No active API keys found')
      missingKeys.push('openai', 'anthropic', 'gemini')
    }

    const canProceed = reasons.length === 0

    const response: GateResponse = {
      can_proceed: canProceed,
      reasons,
      available_providers: availableProviders,
      missing_keys: missingKeys
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Gate check error:', error)
    return new Response(
      JSON.stringify({ 
        can_proceed: false, 
        reasons: ['Internal server error'],
        available_providers: [],
        missing_keys: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})