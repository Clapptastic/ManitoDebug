
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

/**
 * Analyzes geographic market data
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      region, 
      industry,
      includeDemographics = true,
      includeEconomicIndicators = true,
      includeMarketPenetration = true,
      additionalContext = ''
    } = await req.json()

    if (!region || !industry) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Authenticate and propagate user identity to downstream calls
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) {
      return new Response('Missing authorization header', { headers: corsHeaders, status: 401 })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response('Invalid authentication', { headers: corsHeaders, status: 401 })
    }

    // Log the request
    console.log(`Geographic analysis request for ${industry} in ${region}`)

    // Delegate to secure-openai-chat for analysis
    const messages = [
      { role: 'system', content: 'You are a geographic market analyst. Return concise, actionable insights.' },
      { role: 'user', content: `Analyze market potential and landscape for ${industry} in ${region}. Include ${includeDemographics ? 'demographics, ' : ''}${includeEconomicIndicators ? 'economic indicators, ' : ''}${includeMarketPenetration ? 'market penetration, ' : ''}and any critical regional nuances. ${additionalContext || ''}` }
    ]

    const { data, error } = await supabase.functions.invoke('secure-openai-chat', {
      body: {
        messages,
        model: 'gpt-4.1-2025-04-14',
        temperature: 0.6,
        max_tokens: 1200
      },
      headers: { Authorization: authHeader }
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Geographic analysis failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const insights = data?.choices?.[0]?.message?.content || data?.generatedText || ''
    if (!insights) {
      return new Response(JSON.stringify({ error: 'No insights returned from model' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    return new Response(JSON.stringify({ success: true, insights, model: 'gpt-4.1-2025-04-14' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    console.error('Error in analyze-geographic function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during geographic analysis',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
