import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalDataSource {
  name: string;
  type: string;
  authorityWeight: number;
  apiEndpoint?: string;
  apiKeyRequired: boolean;
  dataCategories: string[];
}

interface CompetitorAnalysis {
  id: string;
  name: string;
  website_url?: string;
  industry?: string;
  employee_count?: number;
  revenue_estimate?: number;
  description?: string;
  headquarters?: string;
  founded_year?: number;
  analysis_data?: any;
  confidence_scores?: any;
  source_citations?: any;
}

interface MasterCompanyProfile {
  id?: string;
  company_name: string;
  normalized_name: string;
  primary_domain?: string;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  revenue_estimate?: number;
  description?: string;
  overall_confidence_score: number;
  data_completeness_score: number;
  validation_status: string;
  primary_source_type: string;
  source_analyses: string[];
  external_source_ids: any;
  official_company_data: any;
  financial_data: any;
  technology_stack: any;
  market_position_data: any;
  personnel_data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { analysisId, companyName, userId } = await req.json();

    console.log(`Starting company data consolidation for analysis: ${analysisId}`);

    // Get the source analysis
    const { data: sourceAnalysis, error: analysisError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError || !sourceAnalysis) {
      throw new Error(`Failed to fetch analysis: ${analysisError?.message}`);
    }

    // Normalize company name for matching
    const normalizedName = await normalizeCompanyName(sourceAnalysis.name);
    
    // Find existing master profile using fuzzy matching
    const { data: existingProfiles } = await supabase
      .from('master_company_profiles')
      .select('*')
      .eq('normalized_name', normalizedName);

    let masterProfile: MasterCompanyProfile;
    let isNewProfile = false;

    if (existingProfiles && existingProfiles.length > 0) {
      // Update existing profile
      masterProfile = existingProfiles[0];
      console.log(`Found existing master profile: ${masterProfile.id}`);
      
      // Merge new data with existing profile
      const mergedData = await mergeCompanyData(masterProfile, sourceAnalysis, supabase);
      
      // Update the master profile
      const { error: updateError } = await supabase
        .from('master_company_profiles')
        .update({
          ...mergedData,
          source_analyses: [...(masterProfile.source_analyses || []), analysisId]
        })
        .eq('id', masterProfile.id);

      if (updateError) {
        throw new Error(`Failed to update master profile: ${updateError.message}`);
      }

      // Log the merge operation
      await logProfileMerge(supabase, masterProfile.id!, analysisId, 'data_update', mergedData, userId);

    } else {
      // Create new master profile
      isNewProfile = true;
      console.log(`Creating new master profile for: ${sourceAnalysis.name}`);
      
      const newProfileData = await createMasterProfileFromAnalysis(sourceAnalysis, normalizedName, analysisId, userId);
      
      const { data: createdProfile, error: createError } = await supabase
        .from('master_company_profiles')
        .insert([newProfileData])
        .select()
        .single();

      if (createError || !createdProfile) {
        throw new Error(`Failed to create master profile: ${createError?.message}`);
      }

      masterProfile = createdProfile;

      // Log the creation
      await logProfileMerge(supabase, masterProfile.id!, analysisId, 'new_profile', newProfileData, userId);
    }

    // Validate data against external sources (background process)
    await validateCompanyData(supabase, masterProfile.id!, sourceAnalysis);

    // Calculate and update confidence scores
    await updateConfidenceScores(supabase, masterProfile.id!, sourceAnalysis);

    return new Response(JSON.stringify({
      success: true,
      masterProfileId: masterProfile.id,
      isNewProfile,
      consolidatedData: masterProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in consolidate-company-data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function normalizeCompanyName(name: string): Promise<string> {
  // Normalize company name for fuzzy matching
  return name.toLowerCase()
    .replace(/\s+(inc\.?|llc|ltd\.?|corporation|corp\.?|limited|co\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

async function mergeCompanyData(
  existingProfile: MasterCompanyProfile,
  newAnalysis: CompetitorAnalysis,
  supabase: any
): Promise<Partial<MasterCompanyProfile>> {
  const mergedData: Partial<MasterCompanyProfile> = {};

  // Scalars: prefer newer/better values
  if (newAnalysis.employee_count && (!existingProfile.employee_count || newAnalysis.employee_count > existingProfile.employee_count)) {
    mergedData.employee_count = newAnalysis.employee_count;
  }
  if (newAnalysis.revenue_estimate && (!existingProfile.revenue_estimate || newAnalysis.revenue_estimate > existingProfile.revenue_estimate)) {
    mergedData.revenue_estimate = newAnalysis.revenue_estimate;
  }
  if (newAnalysis.founded_year && !existingProfile.founded_year) {
    mergedData.founded_year = newAnalysis.founded_year;
  }
  if (newAnalysis.headquarters && !existingProfile.headquarters) {
    mergedData.headquarters = newAnalysis.headquarters;
  }
  if (newAnalysis.industry && !existingProfile.industry) {
    mergedData.industry = newAnalysis.industry;
  }
  if (newAnalysis.description && (!existingProfile.description || newAnalysis.description.length > (existingProfile.description?.length || 0))) {
    mergedData.description = newAnalysis.description;
  }
  if (newAnalysis.website_url && !existingProfile["website_url"]) {
    // @ts-ignore align to DB column
    (mergedData as any).website_url = newAnalysis.website_url;
  }

  // JSON: merge technology stack if available
  const currentTech = (existingProfile as any).technology_stack || {};
  const techUpdate = newAnalysis as any;
  const nextTech = { ...currentTech };
  if (techUpdate.technology_analysis) {
    nextTech.technology_analysis = techUpdate.technology_analysis;
  }
  // Only set if there is content
  if (Object.keys(nextTech).length > 0) {
    // @ts-ignore align to DB column
    (mergedData as any).technology_stack = nextTech;
  }

  return mergedData;
}

async function createMasterProfileFromAnalysis(
  analysis: CompetitorAnalysis,
  normalizedName: string,
  analysisId: string,
  userId: string
): Promise<MasterCompanyProfile> {
  const website = analysis.website_url ? analysis.website_url : undefined;

  return {
    company_name: analysis.name,
    normalized_name: normalizedName,
    industry: analysis.industry,
    headquarters: analysis.headquarters,
    founded_year: analysis.founded_year,
    employee_count: analysis.employee_count,
    revenue_estimate: analysis.revenue_estimate,
    description: analysis.description,
    overall_confidence_score: 0,
    data_completeness_score: 0,
    validation_status: 'pending',
    source_analyses: [analysisId],
    technology_stack: analysis.technology_analysis ? { technology_analysis: analysis.technology_analysis } : {},
    website_url: website
  } as unknown as MasterCompanyProfile;
}

async function logProfileMerge(
  supabase: any,
  masterProfileId: string,
  sourceAnalysisId: string,
  mergeType: string,
  mergedData: any,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('master_profile_merges')
    .insert([{
      master_profile_id: masterProfileId,
      source_analysis_id: sourceAnalysisId,
      merge_type: mergeType,
      fields_updated: Object.keys(mergedData),
      confidence_changes: {},
      performed_by: userId,
      merge_notes: `Automated merge from competitor analysis`
    }]);

  if (error) {
    console.error('Error logging profile merge:', error);
  }
}

async function validateCompanyData(
  supabase: any,
  masterProfileId: string,
  analysis: CompetitorAnalysis
): Promise<void> {
  try {
    // Validate website URL
    if (analysis.website_url) {
      await validateWebsite(supabase, masterProfileId, analysis.website_url);
    }

    // Validate basic company info
    await validateBasicInfo(supabase, masterProfileId, analysis);

  } catch (error) {
    console.error('Error in data validation:', error);
  }
}

async function validateWebsite(
  supabase: any,
  masterProfileId: string,
  websiteUrl: string
): Promise<void> {
  try {
    const response = await fetch(websiteUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    const isValid = response.ok;
    
    await supabase
      .from('data_validation_logs')
      .insert([{
        master_profile_id: masterProfileId,
        data_field: 'website_url',
        original_value: websiteUrl,
        validated_value: websiteUrl,
        validation_source: 'web_scrape',
        validation_method: 'http_head_request',
        is_valid: isValid,
        confidence_score: isValid ? 0.9 : 0.1,
        discrepancy_reason: isValid ? null : 'Website not accessible'
      }]);

  } catch (error) {
    console.error('Website validation error:', error);
    
    await supabase
      .from('data_validation_logs')
      .insert([{
        master_profile_id: masterProfileId,
        data_field: 'website_url',
        original_value: websiteUrl,
        validated_value: websiteUrl,
        validation_source: 'web_scrape',
        validation_method: 'http_head_request',
        is_valid: false,
        confidence_score: 0.1,
        discrepancy_reason: error.message
      }]);
  }
}

async function validateBasicInfo(
  supabase: any,
  masterProfileId: string,
  analysis: CompetitorAnalysis
): Promise<void> {
  // Basic validation checks
  const validations = [
    {
      field: 'company_name',
      value: analysis.name,
      isValid: analysis.name && analysis.name.length > 2,
      confidence: analysis.name && analysis.name.length > 2 ? 0.95 : 0.3
    },
    {
      field: 'employee_count',
      value: analysis.employee_count?.toString(),
      isValid: analysis.employee_count && analysis.employee_count > 0,
      confidence: analysis.employee_count && analysis.employee_count > 0 ? 0.7 : 0.2
    }
  ];

  for (const validation of validations) {
    await supabase
      .from('data_validation_logs')
      .insert([{
        master_profile_id: masterProfileId,
        data_field: validation.field,
        original_value: validation.value,
        validated_value: validation.value,
        validation_source: 'ai_analysis',
        validation_method: 'basic_validation',
        is_valid: validation.isValid,
        confidence_score: validation.confidence,
        discrepancy_reason: validation.isValid ? null : 'Invalid or missing data'
      }]);
  }
}

async function updateConfidenceScores(
  supabase: any,
  masterProfileId: string,
  analysis: CompetitorAnalysis
): Promise<void> {
  try {
    // Calculate overall confidence based on data completeness and source reliability
    let totalScore = 0;
    let fieldCount = 0;

    const fields = [
      { name: 'company_name', value: analysis.name, weight: 1.0 },
      { name: 'website_url', value: analysis.website_url, weight: 0.8 },
      { name: 'industry', value: analysis.industry, weight: 0.7 },
      { name: 'employee_count', value: analysis.employee_count, weight: 0.6 },
      { name: 'revenue_estimate', value: analysis.revenue_estimate, weight: 0.8 },
      { name: 'headquarters', value: analysis.headquarters, weight: 0.5 }
    ];

    for (const field of fields) {
      if (field.value) {
        totalScore += (10 * field.weight);
        fieldCount++;

        // Record confidence for this field
        await supabase
          .from('confidence_history')
          .insert([{
            master_profile_id: masterProfileId,
            data_field: field.name,
            confidence_score: 10 * field.weight,
            contributing_sources: { ai_analysis: 'competitor_analysis' },
            score_calculation_method: 'weighted_field_score',
            triggered_by: 'new_data'
          }]);
      }
    }

    const overallConfidence = fieldCount > 0 ? Math.min(100, totalScore / fieldCount) : 0;

    // Update master profile with new confidence score
    await supabase
      .from('master_company_profiles')
      .update({
        overall_confidence_score: overallConfidence,
        data_completeness_score: (fieldCount / fields.length) * 100,
        last_validation_date: new Date().toISOString()
      })
      .eq('id', masterProfileId);

  } catch (error) {
    console.error('Error updating confidence scores:', error);
  }
}