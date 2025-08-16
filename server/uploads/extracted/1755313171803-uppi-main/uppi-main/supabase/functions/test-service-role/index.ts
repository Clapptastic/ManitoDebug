import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Testing service role access...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log(`SUPABASE_URL exists: ${!!supabaseUrl}`)
    console.log(`SUPABASE_SERVICE_ROLE_KEY exists: ${!!serviceKey}`)
    
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required environment variables',
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceKey
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Test database access with service role
    console.log('Testing competitor_analyses table access...')
    const { data, error, count } = await supabase
      .from('competitor_analyses')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Database access failed:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database access failed',
          details: error.message,
          code: error.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully accessed competitor_analyses table. Count: ${count}`)

    // Test master_company_profiles access
    console.log('Testing master_company_profiles table access...')
    const { data: profileData, error: profileError, count: profileCount } = await supabase
      .from('master_company_profiles')
      .select('id', { count: 'exact', head: true })

    if (profileError) {
      console.error('Master profiles access failed:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Master profiles access failed',
          details: profileError.message,
          code: profileError.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully accessed master_company_profiles table. Count: ${profileCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Service role access test passed',
        competitorAnalysesCount: count,
        masterProfilesCount: profileCount,
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})