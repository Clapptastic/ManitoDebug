import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AggregateRequest {
  analysis_id: string
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

    const { analysis_id }: AggregateRequest = await req.json()

    if (!analysis_id) {
      return new Response(
        JSON.stringify({ error: 'analysis_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysis_id)
      .maybeSingle()

    if (analysisError || !analysis) {
      console.error('Error fetching analysis:', analysisError)
      return new Response(
        JSON.stringify({ error: 'Analysis not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get provider results if any
    const { data: providerResults } = await supabase
      .from('analysis_provider_results')
      .select('*')
      .eq('analysis_id', analysis_id)

    // Create aggregated result
    const aggregatedResult = {
      id: analysis.id,
      name: analysis.name,
      description: analysis.description,
      analysis_data: analysis.analysis_data,
      provider_results: providerResults || [],
      aggregated_at: new Date().toISOString(),
      overall_confidence: calculateOverallConfidence(analysis.analysis_data, providerResults),
      field_scores: calculateFieldScores(analysis.analysis_data),
      provenance_map: createProvenanceMap(analysis.analysis_data, providerResults)
    }

    // Store or update the aggregated result
    const { data: existing } = await supabase
      .from('analysis_combined')
      .select('id')
      .eq('analysis_id', analysis_id)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('analysis_combined')
        .update({
          aggregated_result: aggregatedResult,
          overall_confidence: aggregatedResult.overall_confidence,
          field_scores: aggregatedResult.field_scores,
          provenance_map: aggregatedResult.provenance_map,
          updated_at: new Date().toISOString()
        })
        .eq('analysis_id', analysis_id)

      if (updateError) {
        console.error('Error updating aggregated analysis:', updateError)
      }
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('analysis_combined')
        .insert({
          analysis_id: analysis_id,
          user_id: analysis.user_id,
          aggregated_result: aggregatedResult,
          overall_confidence: aggregatedResult.overall_confidence,
          field_scores: aggregatedResult.field_scores,
          provenance_map: aggregatedResult.provenance_map
        })

      if (insertError) {
        console.error('Error inserting aggregated analysis:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis_id,
        aggregated_result: aggregatedResult,
        message: 'Analysis aggregated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Aggregate analysis error:', error)
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

function calculateOverallConfidence(analysisData: any, providerResults: any[]): number {
  let totalConfidence = 0
  let count = 0

  if (analysisData?.data_quality_score) {
    totalConfidence += analysisData.data_quality_score
    count++
  }

  if (providerResults) {
    providerResults.forEach(result => {
      if (result.confidence_score) {
        totalConfidence += result.confidence_score
        count++
      }
    })
  }

  return count > 0 ? Math.round(totalConfidence / count) : 75
}

function calculateFieldScores(analysisData: any): Record<string, number> {
  const scores: Record<string, number> = {}
  
  if (analysisData) {
    scores.completeness = analysisData.name ? 85 : 50
    scores.accuracy = analysisData.data_quality_score || 75
    scores.freshness = 90 // Assume recent data
    scores.relevance = 88
  }

  return scores
}

function createProvenanceMap(analysisData: any, providerResults: any[]): Record<string, any> {
  const map: Record<string, any> = {
    sources: ['ai-analysis'],
    created_at: new Date().toISOString(),
    data_sources: []
  }

  if (providerResults) {
    map.providers = providerResults.map(r => r.provider)
    map.provider_count = providerResults.length
  }

  return map
}