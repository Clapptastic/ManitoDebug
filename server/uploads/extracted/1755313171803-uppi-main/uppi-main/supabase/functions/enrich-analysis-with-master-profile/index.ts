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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { analysisId, masterProfileId, enrichmentLevel = 'selective' } = await req.json()

    console.log(`Enriching analysis ${analysisId} with master profile ${masterProfileId}`)

    // Get the existing analysis
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (analysisError) {
      throw new Error(`Analysis not found: ${analysisError.message}`)
    }

    // Get the master profile
    const { data: masterProfile, error: profileError } = await supabaseClient
      .from('master_company_profiles')
      .select('*')
      .eq('id', masterProfileId)
      .single()

    if (profileError) {
      throw new Error(`Master profile not found: ${profileError.message}`)
    }

    // Calculate data freshness
    const lastUpdated = new Date(masterProfile.updated_at)
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
    const dataFreshness = getDataFreshnessLabel(daysSinceUpdate)

    // Determine enrichment strategy based on level
    const enrichmentData = await generateEnrichmentData(
      analysis,
      masterProfile,
      enrichmentLevel
    )

    // Update the analysis with enriched data (selective updates only)
    const updatesApplied = await applyEnrichmentToAnalysis(
      supabaseClient,
      analysisId,
      enrichmentData,
      enrichmentLevel
    )

    // Log the enrichment
    await supabaseClient
      .from('analysis_enrichment_logs')
      .insert({
        analysis_id: analysisId,
        master_profile_id: masterProfileId,
        enrichment_level: enrichmentLevel,
        updates_applied: updatesApplied,
        data_freshness: dataFreshness,
        confidence_score: masterProfile.overall_confidence_score
      })

    const enrichment = {
      masterProfileData: enrichmentData,
      confidenceScore: masterProfile.overall_confidence_score,
      dataFreshness,
      enrichmentSources: masterProfile.source_analyses || [],
      suggestedUpdates: generateSuggestedUpdates(analysis, masterProfile)
    }

    console.log(`Enrichment complete. Applied ${updatesApplied} updates`)

    return new Response(JSON.stringify({
      success: true,
      enrichment,
      updatesApplied
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in enrich-analysis-with-master-profile:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function generateEnrichmentData(
  analysis: any,
  masterProfile: any,
  enrichmentLevel: string
): Promise<any> {
  const enrichmentData: any = {}

  // Always include basic information if missing or outdated
  if (!analysis.description || masterProfile.description?.length > analysis.description?.length) {
    enrichmentData.description = masterProfile.description
  }

  if (!analysis.industry || masterProfile.industry) {
    enrichmentData.industry = masterProfile.industry
  }

  if (!analysis.headquarters || masterProfile.headquarters) {
    enrichmentData.headquarters = masterProfile.headquarters
  }

  if (!analysis.founded_year || masterProfile.founded_year) {
    enrichmentData.founded_year = masterProfile.founded_year
  }

  // Financial data enrichment
  if (enrichmentLevel !== 'basic') {
    if (!analysis.employee_count && masterProfile.employee_count) {
      enrichmentData.employee_count = masterProfile.employee_count
    }

    if (!analysis.revenue_estimate && masterProfile.revenue_estimate) {
      enrichmentData.revenue_estimate = masterProfile.revenue_estimate
    }

    if (masterProfile.financial_data && Object.keys(masterProfile.financial_data).length > 0) {
      enrichmentData.financial_metrics = masterProfile.financial_data
    }
  }

  // Comprehensive enrichment
  if (enrichmentLevel === 'comprehensive') {
    enrichmentData.technology_stack = masterProfile.technology_stack
    enrichmentData.market_position_data = masterProfile.market_position_data
    enrichmentData.personnel_data = masterProfile.personnel_data
    enrichmentData.confidence_scores = {
      overall: masterProfile.overall_confidence_score,
      data_completeness: masterProfile.data_completeness_score
    }
  }

  return enrichmentData
}

async function applyEnrichmentToAnalysis(
  supabaseClient: any,
  analysisId: string,
  enrichmentData: any,
  enrichmentLevel: string
): Promise<number> {
  let updatesApplied = 0

  try {
    // Only apply updates for fields that should be enriched
    const allowedFields = [
      'description', 'industry', 'headquarters', 'founded_year',
      'employee_count', 'revenue_estimate', 'business_model'
    ]

    const updates: any = {}
    
    for (const [key, value] of Object.entries(enrichmentData)) {
      if (allowedFields.includes(key) && value != null) {
        updates[key] = value
        updatesApplied++
      }
    }

    // Add enrichment metadata
    updates.enriched_from_master_profile = true
    updates.master_profile_enrichment_date = new Date().toISOString()
    updates.enrichment_level = enrichmentLevel

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseClient
        .from('competitor_analyses')
        .update(updates)
        .eq('id', analysisId)

      if (error) {
        console.error('Error applying enrichment updates:', error)
        return 0
      }
    }

    return updatesApplied
  } catch (error) {
    console.error('Error applying enrichment to analysis:', error)
    return 0
  }
}

function getDataFreshnessLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days <= 7) return 'this week'
  if (days <= 30) return 'this month'
  if (days <= 90) return 'this quarter'
  return 'older'
}

function generateSuggestedUpdates(analysis: any, masterProfile: any): string[] {
  const suggestions: string[] = []

  // Compare key fields and suggest updates
  if (masterProfile.employee_count && analysis.employee_count !== masterProfile.employee_count) {
    suggestions.push(`Update employee count to ${masterProfile.employee_count} (from master profile)`)
  }

  if (masterProfile.revenue_estimate && analysis.revenue_estimate !== masterProfile.revenue_estimate) {
    suggestions.push(`Update revenue estimate to $${masterProfile.revenue_estimate} (from master profile)`)
  }

  if (masterProfile.industry && analysis.industry !== masterProfile.industry) {
    suggestions.push(`Update industry classification to "${masterProfile.industry}"`)
  }

  if (masterProfile.headquarters && analysis.headquarters !== masterProfile.headquarters) {
    suggestions.push(`Update headquarters location to "${masterProfile.headquarters}"`)
  }

  // Suggest additional data from master profile
  if (masterProfile.technology_stack && Object.keys(masterProfile.technology_stack).length > 0) {
    suggestions.push('Available: Technology stack information from master profile')
  }

  if (masterProfile.market_position_data && Object.keys(masterProfile.market_position_data).length > 0) {
    suggestions.push('Available: Market positioning data from master profile')
  }

  return suggestions
}