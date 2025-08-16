
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { industry, timeFrame, specificTrends } = await req.json()

    if (!industry || !timeFrame) {
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
    
    // Authenticate user via Authorization header to propagate identity to downstream calls
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Build messages and delegate to secure-openai-chat using the user's JWT
    const messages = [
      { role: 'system', content: 'You are a senior market trends analyst. Provide concise, actionable insights with clear structure.' },
      { role: 'user', content: `Analyze current and emerging trends for industry: ${industry}. Timeframe: ${timeFrame}. ${specificTrends?.length ? 'Focus on: ' + specificTrends.join(', ') : ''}` }
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
      return new Response(
        JSON.stringify({ error: error.message || 'Trend analysis failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const insights = data?.choices?.[0]?.message?.content || data?.generatedText || ''
    if (!insights) {
      return new Response(
        JSON.stringify({ error: 'No insights returned from model' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, insights, model: 'gpt-4.1-2025-04-14' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred during analysis' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
