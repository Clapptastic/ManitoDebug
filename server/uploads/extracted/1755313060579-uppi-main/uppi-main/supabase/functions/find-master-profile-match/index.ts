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

    const { companyName, website, industry, matchingAlgorithm = 'standard' } = await req.json()

    console.log(`Finding master profile match for: ${companyName}`)

    // Normalize company name for matching
    const normalizedName = normalizeCompanyName(companyName)
    
    // Multiple matching strategies
    const matchStrategies = [
      // 1. Exact normalized name match
      { 
        query: supabaseClient
          .from('master_company_profiles')
          .select('*')
          .eq('normalized_name', normalizedName),
        weight: 1.0,
        criteria: 'exact_name_match'
      },
      // 2. Domain-based matching
      ...(website ? [{
        query: supabaseClient
          .from('master_company_profiles')
          .select('*')
          .eq('primary_domain', extractDomain(website)),
        weight: 0.9,
        criteria: 'domain_match'
      }] : []),
      // 3. Fuzzy name matching
      {
        query: supabaseClient
          .from('master_company_profiles')
          .select('*')
          .ilike('company_name', `%${companyName}%`),
        weight: 0.7,
        criteria: 'fuzzy_name_match'
      },
      // 4. Industry + similar name
      ...(industry ? [{
        query: supabaseClient
          .from('master_company_profiles')
          .select('*')
          .eq('industry', industry)
          .ilike('company_name', `%${companyName.split(' ')[0]}%`),
        weight: 0.6,
        criteria: 'industry_name_match'
      }] : [])
    ]

    let bestMatch = null
    let bestScore = 0
    let matchCriteria: string[] = []

    // Try each matching strategy
    for (const strategy of matchStrategies) {
      try {
        const { data, error } = await strategy.query

        if (error) {
          console.error(`Error in strategy ${strategy.criteria}:`, error)
          continue
        }

        if (data && data.length > 0) {
          // Calculate match confidence
          const profile = data[0]
          let confidence = strategy.weight

          // Boost confidence with additional factors
          if (profile.overall_confidence_score > 80) confidence += 0.1
          if (profile.validation_status === 'validated') confidence += 0.1
          if (website && profile.primary_domain === extractDomain(website)) confidence += 0.2
          if (industry && profile.industry === industry) confidence += 0.1

          // Apply AI-enhanced matching if requested
          if (matchingAlgorithm === 'ai_enhanced') {
            confidence = await calculateAIMatchConfidence(
              { companyName, website, industry },
              profile
            )
          }

          if (confidence > bestScore) {
            bestScore = confidence
            bestMatch = profile
            matchCriteria = [strategy.criteria]
          } else if (confidence === bestScore && bestMatch) {
            matchCriteria.push(strategy.criteria)
          }
        }
      } catch (error) {
        console.error(`Error in matching strategy ${strategy.criteria}:`, error)
      }
    }

    // Log the match attempt
    await supabaseClient
      .from('master_profile_match_attempts')
      .insert({
        company_name: companyName,
        website,
        industry,
        match_found: !!bestMatch,
        match_confidence: bestScore,
        match_criteria: matchCriteria,
        master_profile_id: bestMatch?.id || null
      })

    const result = bestMatch ? {
      masterProfileId: bestMatch.id,
      matchConfidence: Math.round(bestScore * 100) / 100,
      matchCriteria,
      existingProfile: bestMatch
    } : null

    console.log(`Match result:`, result ? `Found ${result.masterProfileId} with ${result.matchConfidence} confidence` : 'No match found')

    return new Response(JSON.stringify({
      success: true,
      match: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in find-master-profile-match:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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

function extractDomain(url: string): string | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function calculateAIMatchConfidence(
  inputData: { companyName: string; website?: string; industry?: string },
  profile: any
): Promise<number> {
  try {
    // This would integrate with OpenAI/Anthropic for AI-enhanced matching
    // For now, return an enhanced confidence based on multiple factors
    let confidence = 0

    // Name similarity (enhanced)
    const nameSimilarity = calculateStringSimilarity(
      inputData.companyName.toLowerCase(),
      profile.company_name.toLowerCase()
    )
    confidence += nameSimilarity * 0.4

    // Domain matching
    if (inputData.website && profile.primary_domain) {
      const inputDomain = extractDomain(inputData.website)
      if (inputDomain === profile.primary_domain) {
        confidence += 0.3
      }
    }

    // Industry matching
    if (inputData.industry && profile.industry) {
      if (inputData.industry.toLowerCase() === profile.industry.toLowerCase()) {
        confidence += 0.2
      }
    }

    // Data completeness boost
    if (profile.data_completeness_score > 70) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  } catch (error) {
    console.error('Error calculating AI match confidence:', error)
    return 0.5 // Default confidence
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance-based similarity
  const len1 = str1.length
  const len2 = str2.length
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost // substitution
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  return (maxLen - matrix[len2][len1]) / maxLen
}