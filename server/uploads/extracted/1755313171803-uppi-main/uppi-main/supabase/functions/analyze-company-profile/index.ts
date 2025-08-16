import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyAnalysisRequest {
  website_url: string
  company_name?: string
  existing_profile_id?: string
}

interface CompanyAnalysisResult {
  // Basic Information
  company_name: string
  description?: string
  tagline?: string
  founded_year?: number
  legal_structure?: string
  
  // Contact & Location
  website_url?: string
  email?: string
  phone?: string
  headquarters?: string
  
  // Business Model
  business_model?: string
  value_proposition?: string
  revenue_streams?: string[]
  target_market?: string[]
  customer_segments?: string[]
  
  // Financial & Growth
  revenue_estimate?: number
  employee_count?: number
  funding_stage?: string
  funding_amount?: number
  
  // Market & Competition
  industry?: string
  market_position?: string
  competitive_advantages?: string[]
  key_differentiators?: string[]
  
  // Products & Services
  key_products?: string[]
  pricing_strategy?: any
  
  // Technology & Operations
  technology_stack?: any
  partnerships?: string[]
  
  // Marketing & Sales
  marketing_channels?: string[]
  sales_strategy?: string
  
  // Team & Culture
  key_personnel?: any
  company_culture?: string
  values?: string[]
  
  // Analysis metadata
  confidence_scores?: any
  data_sources?: any
}

serve(async (req) => {
  console.log('🚀 Company profile analysis function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'Unknown error'}`);
    }

    // Parse request body
    const { website_url, company_name, existing_profile_id }: CompanyAnalysisRequest = await req.json();
    
    console.log(`📊 Analyzing company profile for: ${company_name || website_url}`);

    // Get user's API keys for AI analysis
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (apiKeyError) {
      throw new Error(`Failed to fetch API keys: ${apiKeyError.message}`);
    }

    console.log(`Found ${apiKeys?.length || 0} active API keys`);

    let analysisResult: CompanyAnalysisResult;

    if (apiKeys && apiKeys.length > 0) {
      // Use AI analysis with available providers
      analysisResult = await analyzeCompanyWithAI(website_url, company_name, apiKeys);
    } else {
      // Fallback: Basic analysis without AI
      analysisResult = await basicCompanyAnalysis(website_url, company_name);
    }

    // Save or update company profile
    let profileData;
    if (existing_profile_id) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('company_profiles')
        .update({
          ...analysisResult,
          last_ai_analysis: new Date().toISOString(),
          ai_analysis_data: {
            analysis_date: new Date().toISOString(),
            analysis_result: analysisResult,
            website_analyzed: website_url
          }
        })
        .eq('id', existing_profile_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      profileData = updatedProfile;
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          ...analysisResult,
          last_ai_analysis: new Date().toISOString(),
          ai_analysis_data: {
            analysis_date: new Date().toISOString(),
            analysis_result: analysisResult,
            website_analyzed: website_url
          }
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }
      profileData = newProfile;
    }

    console.log(`✅ Company profile analysis completed for ${analysisResult.company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        profile: profileData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Company profile analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzeCompanyWithAI(
  website_url: string, 
  company_name?: string, 
  apiKeys: any[]
): Promise<CompanyAnalysisResult> {
  console.log('🤖 Analyzing company with AI...');

  // Try OpenAI first, then Anthropic
  const openAIKey = apiKeys.find(key => key.provider === 'openai');
  const anthropicKey = apiKeys.find(key => key.provider === 'anthropic');

  let analysisResult: any = null;

  if (openAIKey) {
    try {
      analysisResult = await analyzeCompanyWithOpenAI(website_url, company_name, openAIKey.api_key);
    } catch (error) {
      console.error('OpenAI company analysis failed:', error);
    }
  }

  if (!analysisResult && anthropicKey) {
    try {
      analysisResult = await analyzeCompanyWithAnthropic(website_url, company_name, anthropicKey.api_key);
    } catch (error) {
      console.error('Anthropic company analysis failed:', error);
    }
  }

  if (analysisResult) {
    return parseCompanyAnalysisResponse(analysisResult, website_url, company_name);
  }

  // Fallback if all AI providers fail
  return basicCompanyAnalysis(website_url, company_name);
}

async function analyzeCompanyWithOpenAI(
  website_url: string, 
  company_name?: string, 
  apiKey: string
): Promise<any> {
  console.log('🔄 Using OpenAI for company analysis...');

  const analysisPrompt = `Analyze the company at website "${website_url}" ${company_name ? `(company name: ${company_name})` : ''} and provide comprehensive business profile information.

Please analyze the website content, about pages, team information, product/service offerings, and any available public information to create a detailed company profile.

Provide the analysis in the following JSON format:
{
  "company_name": "extracted or provided company name",
  "description": "comprehensive company description",
  "tagline": "company tagline or slogan if found",
  "founded_year": year_founded_as_number_or_null,
  "legal_structure": "corporation/LLC/partnership/etc if determinable",
  
  "website_url": "validated website URL",
  "email": "contact email if found",
  "phone": "contact phone if found", 
  "headquarters": "headquarters location",
  
  "business_model": "detailed business model description",
  "value_proposition": "unique value proposition",
  "revenue_streams": ["array of revenue streams"],
  "target_market": ["array of target market segments"],
  "customer_segments": ["array of customer segments"],
  
  "revenue_estimate": estimated_annual_revenue_or_null,
  "employee_count": estimated_employee_count_or_null,
  "funding_stage": "startup/growth/established/public/etc",
  "funding_amount": estimated_funding_amount_or_null,
  
  "industry": "primary industry classification",
  "market_position": "market position description",
  "competitive_advantages": ["array of competitive advantages"],
  "key_differentiators": ["array of key differentiators"],
  
  "key_products": ["array of main products/services"],
  "pricing_strategy": {
    "model": "freemium/subscription/one-time/custom",
    "tiers": [{"name": "tier name", "price": "price info"}],
    "positioning": "pricing positioning strategy"
  },
  
  "technology_stack": {
    "frontend": ["technologies used"],
    "backend": ["technologies used"],
    "tools": ["tools and platforms"]
  },
  "partnerships": ["strategic partnerships"],
  
  "marketing_channels": ["marketing channels used"],
  "sales_strategy": "sales approach description",
  
  "key_personnel": {
    "ceo": "CEO name and background if available",
    "founders": ["founder information"],
    "leadership": ["other key leadership"]
  },
  "company_culture": "company culture description",
  "values": ["company values"],
  
  "confidence_scores": {
    "overall": confidence_0_to_100,
    "basic_info": confidence_0_to_100,
    "business_model": confidence_0_to_100,
    "financial": confidence_0_to_100
  },
   "data_sources": ["sources used for analysis"]
}

Focus on accuracy and only include information that can be reasonably inferred from the website and public sources. Use null for unknown values rather than guessing.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: analysisPrompt
      }],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeCompanyWithAnthropic(
  website_url: string, 
  company_name?: string, 
  apiKey: string
): Promise<any> {
  console.log('🔄 Using Anthropic for company analysis...');

  const analysisPrompt = `Analyze the company at website "${website_url}" ${company_name ? `(company name: ${company_name})` : ''} and provide comprehensive business profile information in JSON format.

Focus on extracting accurate business information from the website content, about pages, team information, and product/service offerings.

Return a detailed JSON object with all discoverable company information including basic details, business model, market position, team, and technology stack. Only include information that can be reasonably determined from available sources.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseCompanyAnalysisResponse(
  response: string, 
  website_url: string, 
  company_name?: string
): CompanyAnalysisResult {
  try {
    // Try to extract JSON from response
    let parsed: any = null;
    
    try {
      parsed = JSON.parse(response);
    } catch (directParseError) {
      // Try to extract JSON from markdown
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        parsed = JSON.parse(jsonStr);
      }
    }

    if (parsed && parsed.company_name) {
      return {
        company_name: parsed.company_name || company_name || 'Unknown Company',
        description: parsed.description,
        tagline: parsed.tagline,
        founded_year: parsed.founded_year,
        legal_structure: parsed.legal_structure,
        website_url: parsed.website_url || website_url,
        email: parsed.email,
        phone: parsed.phone,
        headquarters: parsed.headquarters,
        business_model: parsed.business_model,
        value_proposition: parsed.value_proposition,
        revenue_streams: parsed.revenue_streams || [],
        target_market: parsed.target_market || [],
        customer_segments: parsed.customer_segments || [],
        revenue_estimate: parsed.revenue_estimate,
        employee_count: parsed.employee_count,
        funding_stage: parsed.funding_stage,
        funding_amount: parsed.funding_amount,
        industry: parsed.industry,
        market_position: parsed.market_position,
        competitive_advantages: parsed.competitive_advantages || [],
        key_differentiators: parsed.key_differentiators || [],
        key_products: parsed.key_products || [],
        pricing_strategy: parsed.pricing_strategy || {},
        technology_stack: parsed.technology_stack || {},
        partnerships: parsed.partnerships || [],
        marketing_channels: parsed.marketing_channels || [],
        sales_strategy: parsed.sales_strategy,
        key_personnel: parsed.key_personnel || {},
        company_culture: parsed.company_culture,
        values: parsed.values || [],
        confidence_scores: parsed.confidence_scores || {},
        data_sources: parsed.data_sources || []
      };
    }
  } catch (parseError) {
    console.error('Failed to parse company analysis response:', parseError);
  }

  // Fallback if parsing fails
  return basicCompanyAnalysis(website_url, company_name);
}

async function basicCompanyAnalysis(
  website_url: string, 
  company_name?: string
): Promise<CompanyAnalysisResult> {
  // Basic analysis without AI - extract domain info and provide structure
  const domain = new URL(website_url).hostname.replace('www.', '');
  const inferredName = company_name || domain.split('.')[0].replace(/[-_]/g, ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return {
    company_name: inferredName,
    website_url: website_url,
    description: `Company profile for ${inferredName}`,
    confidence_scores: {
      overall: 30,
      basic_info: 50,
      business_model: 10,
      financial: 5
    },
    data_sources: ['domain_analysis', 'basic_inference']
  };
}