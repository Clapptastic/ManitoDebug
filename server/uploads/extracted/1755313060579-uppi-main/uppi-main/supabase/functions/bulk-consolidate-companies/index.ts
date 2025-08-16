
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ensure admin credentials are present; without them RLS/permissions will fail
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase admin credentials: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Supabase admin credentials in edge function' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    console.log('Starting bulk consolidation of competitor analyses')

    // Get all competitor analyses using service role (bypasses RLS)
    const { data: analyses, error: analysesError } = await supabaseClient
      .from('competitor_analyses')
      .select('*')
      .order('created_at', { ascending: false })

    if (analysesError) {
      console.error('Failed to fetch analyses:', analysesError)
      const status = (analysesError as any).code === '42501' ? 403 : 500
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch analyses',
          details: (analysesError as any).message,
          hint: (analysesError as any).code === '42501' 
            ? 'Permission denied: Configure SUPABASE_SERVICE_ROLE_KEY for this function or adjust RLS policies.' 
            : null
        }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${analyses?.length || 0} competitor analyses to process`)

    let profilesCreated = 0
    let profilesUpdated = 0
    let errors = 0

    for (const analysis of analyses || []) {
      try {
        console.log(`Processing analysis: ${analysis.name} (${analysis.id})`)

        // Normalize company name for matching
        const normalizedName = normalizeCompanyName(analysis.name)

        // Check if master profile already exists
        const { data: existingProfile } = await supabaseClient
          .from('master_company_profiles')
          .select('id, source_analyses')
          .eq('normalized_name', normalizedName)
          .maybeSingle()

        if (existingProfile) {
          // Update existing profile if this analysis isn't already included
          if (!existingProfile.source_analyses?.includes(analysis.id)) {
            await updateMasterProfile(supabaseClient, existingProfile.id, analysis)
            profilesUpdated++
            console.log(`Updated existing profile: ${existingProfile.id}`)
          } else {
            console.log(`Analysis already included in profile: ${existingProfile.id}`)
          }
        } else {
          // Create new master profile
          const newProfile = await createMasterProfile(supabaseClient, analysis, normalizedName)
          if (newProfile) {
            profilesCreated++
            console.log(`Created new profile: ${newProfile.id}`)
          }
        }
      } catch (error) {
        console.error(`Error processing analysis ${analysis.id}:`, error)
        errors++
      }
    }

    console.log(`Bulk consolidation complete. Created: ${profilesCreated}, Updated: ${profilesUpdated}, Errors: ${errors}`)

    return new Response(JSON.stringify({
      success: true,
      profilesCreated,
      profilesUpdated,
      errors,
      totalProcessed: analyses?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in bulk-consolidate-companies:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(inc\.?|llc|ltd\.?|corporation|corp\.?|limited|co\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

async function createMasterProfile(supabase: any, analysis: any, normalizedName: string) {
  const website = analysis.website_url ? analysis.website_url : null
  
  const profileData = {
    company_name: analysis.name,
    normalized_name: normalizedName,
    description: analysis.description,
    industry: analysis.industry,
    headquarters: analysis.headquarters,
    founded_year: analysis.founded_year,
    employee_count: analysis.employee_count,
    revenue_estimate: analysis.revenue_estimate,
    business_model: analysis.business_model,
    website_url: website,
    validation_status: 'pending',
    source_analyses: [analysis.id],
    overall_confidence_score: calculateConfidenceScore(analysis),
    data_completeness_score: calculateDataCompleteness(analysis),
    technology_stack: analysis.technology_analysis ? { technology_analysis: analysis.technology_analysis } : {}
  }

  const { data, error } = await supabase
    .from('master_company_profiles')
    .insert([profileData])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating master profile:', error)
    return null
  }

  return data
}

async function updateMasterProfile(supabase: any, profileId: string, analysis: any) {
  // Get current profile
  const { data: currentProfile } = await supabase
    .from('master_company_profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!currentProfile) return

  // Merge data intelligently
  const updates: any = {}

  // Update fields if new data is better
  if (analysis.description && (!currentProfile.description || analysis.description.length > currentProfile.description.length)) {
    updates.description = analysis.description
  }

  if (analysis.industry && !currentProfile.industry) {
    updates.industry = analysis.industry
  }

  if (analysis.headquarters && !currentProfile.headquarters) {
    updates.headquarters = analysis.headquarters
  }

  if (analysis.founded_year && !currentProfile.founded_year) {
    updates.founded_year = analysis.founded_year
  }

  if (analysis.employee_count && (!currentProfile.employee_count || analysis.employee_count > currentProfile.employee_count)) {
    updates.employee_count = analysis.employee_count
  }

  if (analysis.revenue_estimate && (!currentProfile.revenue_estimate || analysis.revenue_estimate > currentProfile.revenue_estimate)) {
    updates.revenue_estimate = analysis.revenue_estimate
  }

  if (analysis.business_model && !currentProfile.business_model) {
    updates.business_model = analysis.business_model
  }

  // Add to source analyses
  const sourceAnalyses = currentProfile.source_analyses || []
  if (!sourceAnalyses.includes(analysis.id)) {
    updates.source_analyses = [...sourceAnalyses, analysis.id]
  }

  // Recalculate scores
  const updatedProfile = { ...currentProfile, ...updates }
  updates.data_completeness_score = calculateDataCompleteness(updatedProfile)
  updates.overall_confidence_score = calculateConfidenceScore(updatedProfile)

  const { error } = await supabase
    .from('master_company_profiles')
    .update(updates)
    .eq('id', profileId)

  if (error) {
    console.error('Error updating master profile:', error)
  } else {
    try {
      await supabase
        .from('master_profile_merges')
        .insert([{
          master_profile_id: profileId,
          source_analysis_id: analysis.id,
          merge_type: 'analysis_update',
          fields_updated: Object.keys(updates),
          merge_notes: 'Bulk consolidation update'
        }]);
    } catch (e) {
      console.error('Error logging master_profile_merges:', e)
    }
  }
}

function calculateDataCompleteness(data: any): number {
  const fields = [
    'company_name', 'industry', 'headquarters', 'founded_year',
    'employee_count', 'revenue_estimate', 'business_model', 'description'
  ]
  
  const filledFields = fields.filter(field => 
    data[field] != null && data[field] !== '' && data[field] !== 0
  )
  
  return Math.round((filledFields.length / fields.length) * 100)
}

function calculateConfidenceScore(data: any): number {
  let score = 0
  let maxScore = 0
  
  // Base score for having company name
  if (data.company_name && data.company_name.length > 2) {
    score += 25
  }
  maxScore += 25
  
  // Website verification
  if (data.website_url) {
    score += 15
  }
  maxScore += 15
  
  // Industry classification
  if (data.industry) {
    score += 10
  }
  maxScore += 10
  
  // Financial data
  if (data.employee_count && data.employee_count > 0) {
    score += 15
  }
  maxScore += 15
  
  if (data.revenue_estimate && data.revenue_estimate > 0) {
    score += 15
  }
  maxScore += 15
  
  // Additional details
  if (data.headquarters) {
    score += 10
  }
  maxScore += 10
  
  if (data.founded_year) {
    score += 5
  }
  maxScore += 5
  
  if (data.description && data.description.length > 50) {
    score += 5
  }
  maxScore += 5
  
  return Math.round((score / maxScore) * 100)
}
