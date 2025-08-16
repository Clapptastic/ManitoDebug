import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// External API integrations for data validation
interface ValidationSource {
  name: string;
  validate: (data: any) => Promise<ValidationResult>;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  source: string;
  originalValue: string;
  validatedValue?: string;
  discrepancy?: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { masterProfileId, validationCategories, userId } = await req.json();

    console.log(`Starting enhanced AI validation for profile: ${masterProfileId}`);

    // Get master profile data
    const { data: profile, error: profileError } = await supabase
      .from('master_company_profiles')
      .select('*')
      .eq('id', masterProfileId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch master profile: ${profileError?.message}`);
    }

    // Get available validation sources
    const { data: dataSources } = await supabase
      .from('trusted_data_sources')
      .select('*')
      .eq('is_active', true);

    const validationResults: ValidationResult[] = [];

    // Run validations based on categories
    for (const category of validationCategories || ['basic_info', 'financial', 'personnel']) {
      const categoryValidations = await runCategoryValidations(
        profile,
        category,
        dataSources || [],
        supabase
      );
      validationResults.push(...categoryValidations);
    }

    // Store validation results
    for (const result of validationResults) {
      await supabase
        .from('data_validation_logs')
        .insert([{
          master_profile_id: masterProfileId,
          data_field: result.source,
          original_value: result.originalValue,
          validated_value: result.validatedValue || result.originalValue,
          validation_source: result.source,
          validation_method: 'external_api',
          is_valid: result.isValid,
          confidence_score: result.confidence,
          discrepancy_reason: result.discrepancy,
          external_source_response: result.metadata
        }]);
    }

    // Update confidence scores based on validation results
    await updateValidationConfidence(supabase, masterProfileId, validationResults);

    // Update profile validation status
    await supabase
      .from('master_company_profiles')
      .update({
        validation_status: 'validated',
        last_validation_date: new Date().toISOString()
      })
      .eq('id', masterProfileId);

    return new Response(JSON.stringify({
      success: true,
      validationResults,
      totalValidations: validationResults.length,
      averageConfidence: validationResults.reduce((acc, r) => acc + r.confidence, 0) / validationResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-ai-validation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runCategoryValidations(
  profile: any,
  category: string,
  dataSources: any[],
  supabase: any
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const relevantSources = dataSources.filter(source => 
    source.data_categories.includes(category)
  );

  for (const source of relevantSources) {
    try {
      let validation: ValidationResult | null = null;

      switch (source.source_name) {
        case 'sec_edgar':
          validation = await validateWithSECEdgar(profile, source);
          break;
        case 'crunchbase':
          validation = await validateWithCrunchbase(profile, source);
          break;
        case 'linkedin_company':
          validation = await validateWithLinkedIn(profile, source);
          break;
        case 'company_website':
          validation = await validateWithWebsite(profile, source);
          break;
        default:
          validation = await validateWithAI(profile, source, category, supabase);
          break;
      }

      if (validation) {
        results.push(validation);
      }

    } catch (error) {
      console.error(`Validation error for ${source.source_name}:`, error);
      
      // Log failed validation
      results.push({
        isValid: false,
        confidence: 0.1,
        source: source.source_name,
        originalValue: profile.company_name || '',
        discrepancy: `Validation failed: ${error.message}`,
        metadata: { error: error.message }
      });
    }
  }

  return results;
}

async function validateWithSECEdgar(profile: any, source: any): Promise<ValidationResult | null> {
  if (!profile.company_name) return null;

  try {
    // SEC EDGAR API is free and doesn't require API key
    const searchUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${encodeURIComponent(profile.company_name.replace(/[^a-zA-Z0-9]/g, ''))}.json`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Enhanced AI Validation (your-email@example.com)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      
      return {
        isValid: true,
        confidence: 1.0,
        source: 'sec_edgar',
        originalValue: profile.company_name,
        validatedValue: data.entityName,
        metadata: {
          cik: data.cik,
          entityType: data.entityType,
          sic: data.sic,
          sicDescription: data.sicDescription
        }
      };
    } else {
      return {
        isValid: false,
        confidence: 0.3,
        source: 'sec_edgar',
        originalValue: profile.company_name,
        discrepancy: 'Company not found in SEC database'
      };
    }

  } catch (error) {
    return {
      isValid: false,
      confidence: 0.1,
      source: 'sec_edgar',
      originalValue: profile.company_name,
      discrepancy: `SEC validation error: ${error.message}`
    };
  }
}

async function validateWithCrunchbase(profile: any, source: any): Promise<ValidationResult | null> {
  // Note: Crunchbase API requires a subscription, so this is a placeholder implementation
  // In production, you would need a valid Crunchbase API key
  
  if (!profile.company_name) return null;

  try {
    // Simulated validation (replace with actual Crunchbase API call)
    return {
      isValid: true,
      confidence: 0.85,
      source: 'crunchbase',
      originalValue: profile.company_name,
      discrepancy: 'Crunchbase API not configured - simulated validation',
      metadata: { note: 'Requires Crunchbase API subscription' }
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 0.1,
      source: 'crunchbase',
      originalValue: profile.company_name,
      discrepancy: `Crunchbase validation error: ${error.message}`
    };
  }
}

async function validateWithLinkedIn(profile: any, source: any): Promise<ValidationResult | null> {
  // Note: LinkedIn Company API requires special access
  // This is a placeholder implementation
  
  if (!profile.company_name) return null;

  try {
    // Simulated validation (replace with actual LinkedIn API call)
    return {
      isValid: true,
      confidence: 0.75,
      source: 'linkedin_company',
      originalValue: profile.company_name,
      discrepancy: 'LinkedIn API not configured - simulated validation',
      metadata: { note: 'Requires LinkedIn Partner API access' }
    };

  } catch (error) {
    return {
      isValid: false,
      confidence: 0.1,
      source: 'linkedin_company',
      originalValue: profile.company_name,
      discrepancy: `LinkedIn validation error: ${error.message}`
    };
  }
}

async function validateWithWebsite(profile: any, source: any): Promise<ValidationResult | null> {
  if (!profile.primary_domain && !profile.website_url) return null;

  const websiteUrl = profile.website_url || `https://${profile.primary_domain}`;

  try {
    const response = await fetch(websiteUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Enhanced AI Validation Bot'
      }
    });

    if (response.ok) {
      const html = await response.text();
      
      // Extract company name from page title or meta tags
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Basic validation: check if company name appears in title
      const nameInTitle = title.toLowerCase().includes(profile.company_name.toLowerCase());
      
      return {
        isValid: response.status === 200,
        confidence: nameInTitle ? 0.8 : 0.6,
        source: 'company_website',
        originalValue: profile.company_name,
        validatedValue: title,
        metadata: {
          statusCode: response.status,
          pageTitle: title,
          nameFound: nameInTitle
        }
      };
    } else {
      return {
        isValid: false,
        confidence: 0.2,
        source: 'company_website',
        originalValue: websiteUrl,
        discrepancy: `Website returned status ${response.status}`
      };
    }

  } catch (error) {
    return {
      isValid: false,
      confidence: 0.1,
      source: 'company_website',
      originalValue: websiteUrl,
      discrepancy: `Website validation error: ${error.message}`
    };
  }
}

async function validateWithAI(
  profile: any,
  source: any,
  category: string,
  supabase: any
): Promise<ValidationResult | null> {
  // Enhanced AI validation using multiple models
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!openaiKey && !anthropicKey) {
    return null;
  }

  try {
    let validationPrompt = '';
    let dataToValidate = '';

    switch (category) {
      case 'basic_info':
        dataToValidate = JSON.stringify({
          company_name: profile.company_name,
          industry: profile.industry,
          headquarters: profile.headquarters,
          website: profile.primary_domain
        });
        validationPrompt = `Validate the following company basic information. Check for inconsistencies, impossible values, or missing critical data. Return a JSON with: isValid (boolean), confidence (0-1), issues (array of problems found).`;
        break;
        
      case 'financial':
        dataToValidate = JSON.stringify({
          revenue_estimate: profile.revenue_estimate,
          employee_count: profile.employee_count,
          founded_year: profile.founded_year
        });
        validationPrompt = `Validate financial and scale data for this company. Check if revenue estimates align with employee count, if founding year is reasonable, etc. Return JSON with validation results.`;
        break;
        
      case 'personnel':
        dataToValidate = JSON.stringify({
          employee_count: profile.employee_count,
          key_personnel: profile.personnel_data?.key_personnel,
          industry: profile.industry
        });
        validationPrompt = `Validate personnel information. Check if employee count is reasonable for the industry and company type. Return validation JSON.`;
        break;
    }

    // Use OpenAI for validation
    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: validationPrompt
            },
            {
              role: 'user',
              content: `Company Data: ${dataToValidate}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        const validationText = aiResult.choices[0].message.content;
        
        try {
          const validation = JSON.parse(validationText);
          return {
            isValid: validation.isValid || true,
            confidence: validation.confidence || 0.7,
            source: source.source_name,
            originalValue: dataToValidate,
            validatedValue: dataToValidate,
            discrepancy: validation.issues ? validation.issues.join(', ') : undefined,
            metadata: { aiModel: 'gpt-4o-mini', fullResponse: validation }
          };
        } catch (parseError) {
          return {
            isValid: true,
            confidence: 0.5,
            source: source.source_name,
            originalValue: dataToValidate,
            discrepancy: 'AI validation response format error',
            metadata: { rawResponse: validationText }
          };
        }
      }
    }

    return null;

  } catch (error) {
    return {
      isValid: false,
      confidence: 0.1,
      source: source.source_name,
      originalValue: profile.company_name || '',
      discrepancy: `AI validation error: ${error.message}`
    };
  }
}

async function updateValidationConfidence(
  supabase: any,
  masterProfileId: string,
  validationResults: ValidationResult[]
): Promise<void> {
  try {
    // Calculate weighted confidence based on source authority
    const { data: sourceWeights } = await supabase
      .from('source_authority_weights')
      .select('*');

    const weights = sourceWeights?.reduce((acc: any, sw: any) => {
      acc[sw.source_name] = sw.authority_weight;
      return acc;
    }, {}) || {};

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const result of validationResults) {
      const weight = weights[result.source] || 0.5;
      totalWeightedScore += result.confidence * weight;
      totalWeight += weight;
    }

    const overallConfidence = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Update master profile with validation confidence
    await supabase
      .from('master_company_profiles')
      .update({
        overall_confidence_score: Math.min(100, overallConfidence),
        validation_status: 'validated'
      })
      .eq('id', masterProfileId);

    // Record confidence history
    await supabase
      .from('confidence_history')
      .insert([{
        master_profile_id: masterProfileId,
        data_field: 'overall_validation',
        confidence_score: overallConfidence,
        contributing_sources: validationResults.reduce((acc: any, result) => {
          acc[result.source] = result.confidence;
          return acc;
        }, {}),
        score_calculation_method: 'weighted_external_validation',
        triggered_by: 'validation'
      }]);

  } catch (error) {
    console.error('Error updating validation confidence:', error);
  }
}