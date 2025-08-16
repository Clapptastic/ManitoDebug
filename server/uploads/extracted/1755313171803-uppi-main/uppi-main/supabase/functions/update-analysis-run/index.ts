import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateRequest {
  action: 'complete' | 'fail'
  runId: string
  outputData?: any
  errorMessage?: string
  executionTimeMs?: number
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

    const { action, runId, outputData, errorMessage, executionTimeMs }: UpdateRequest = await req.json()

    if (!runId) {
      return new Response(
        JSON.stringify({ error: 'runId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updateData: any = {
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (executionTimeMs) {
      updateData.execution_time_ms = executionTimeMs
    }

    if (action === 'complete') {
      updateData.status = 'completed'
      if (outputData) {
        updateData.output_data = outputData
      }
    } else if (action === 'fail') {
      updateData.status = 'failed'
      if (errorMessage) {
        updateData.error_message = errorMessage
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "complete" or "fail"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase
      .from('analysis_runs')
      .update(updateData)
      .eq('id', runId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating analysis run:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update analysis run' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: `Analysis run ${action}d successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Update analysis run error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})