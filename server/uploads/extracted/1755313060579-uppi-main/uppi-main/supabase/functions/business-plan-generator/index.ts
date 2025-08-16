import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, industry, businessModel } = await req.json();

    if (!businessName || !industry || !businessModel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating business plan for: ${businessName} in ${industry} industry`);

    const prompt = `Generate a comprehensive business plan for "${businessName}", a ${businessModel} business in the ${industry} industry. 

    Return a detailed JSON object with the following structure:
    {
      "executiveSummary": {
        "overview": "detailed business overview",
        "vision": "company vision statement",
        "mission": "company mission statement", 
        "objectives": ["objective 1", "objective 2", "objective 3"],
        "keySuccessFactors": ["factor 1", "factor 2", "factor 3"]
      },
      "marketAnalysis": {
        "industryOverview": "detailed industry analysis",
        "targetMarket": ["market segment 1", "market segment 2"],
        "marketSize": {
          "tam": "$X billion",
          "sam": "$X million",
          "som": "$X million"
        },
        "competitorAnalysis": ["competitor analysis 1", "competitor analysis 2"],
        "marketTrends": ["trend 1", "trend 2", "trend 3"]
      },
      "businessModel": {
        "valueProposition": "unique value proposition",
        "revenueStreams": ["stream 1", "stream 2"],
        "costStructure": ["cost 1", "cost 2"],
        "keyPartners": ["partner 1", "partner 2"],
        "keyActivities": ["activity 1", "activity 2"]
      },
      "productDevelopment": {
        "productDescription": "detailed product description",
        "developmentPhases": ["phase 1", "phase 2"],
        "timeline": "development timeline",
        "resources": ["resource 1", "resource 2"],
        "mvpFeatures": ["feature 1", "feature 2"],
        "roadmap": {
          "phase1": "phase 1 description",
          "phase2": "phase 2 description", 
          "phase3": "phase 3 description"
        }
      },
      "marketingStrategy": {
        "targetAudience": "detailed target audience",
        "marketingChannels": ["channel 1", "channel 2"],
        "marketingBudget": 50000,
        "campaigns": ["campaign 1", "campaign 2"]
      },
      "operationsManagement": {
        "operationalStructure": "operational structure description",
        "processes": ["process 1", "process 2"],
        "qualityControl": ["qc measure 1", "qc measure 2"],
        "suppliers": ["supplier 1", "supplier 2"],
        "teamStructure": {
          "CEO": 1,
          "CTO": 1,
          "Developers": 3,
          "Sales": 2,
          "Marketing": 2
        },
        "keyOperations": ["operation 1", "operation 2"]
      },
      "financialProjections": {
        "revenueProjections": [100000, 500000, 1200000],
        "expenseProjections": [80000, 350000, 800000],
        "profitabilityAnalysis": "detailed profitability analysis",
        "fundingRequirements": {
          "seedRound": 250000,
          "seriesA": 2000000
        },
        "year1": {
          "revenue": 100000,
          "expenses": 80000,
          "netIncome": 20000,
          "customers": 100
        },
        "year2": {
          "revenue": 500000,
          "expenses": 350000,
          "netIncome": 150000,
          "customers": 500
        },
        "year3": {
          "revenue": 1200000,
          "expenses": 800000,
          "netIncome": 400000,
          "customers": 1200
        }
      },
      "riskAnalysis": {
        "identifiedRisks": ["risk 1", "risk 2", "risk 3"],
        "mitigationStrategies": ["strategy 1", "strategy 2"],
        "contingencyPlans": ["plan 1", "plan 2"],
        "marketRisks": ["market risk 1", "market risk 2"],
        "technicalRisks": ["tech risk 1", "tech risk 2"],
        "financialRisks": ["financial risk 1", "financial risk 2"]
      },
      "implementation": {
        "milestones": ["milestone 1", "milestone 2", "milestone 3"],
        "timeline": "18-month implementation timeline",
        "responsibilities": ["responsibility 1", "responsibility 2"],
        "successMetrics": ["metric 1", "metric 2", "metric 3"]
      }
    }

    Make the business plan realistic, detailed, and specific to the ${industry} industry and ${businessModel} business model. Include actual market data and realistic financial projections.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business consultant and strategic planner with access to comprehensive market research databases. Generate comprehensive, realistic business plans with accurate market data and financial projections. CRITICAL: You must cite specific sources with direct URLs for all market data, competitive analysis, financial benchmarks, and industry trends. Always return valid JSON with a "source_citations" section containing detailed source information for each major claim.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let businessPlanText = data.choices[0].message.content;

    // Extract JSON from the response
    const jsonMatch = businessPlanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    const businessPlan = JSON.parse(jsonMatch[0]);

    // Store the business plan in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('business_plans').insert({
          user_id: user.id,
          business_name: businessName,
          industry,
          business_model: businessModel,
          plan_data: businessPlan,
          status: 'generated'
        });
        
        console.log(`Business plan stored for user: ${user.id}`);
      }
    }

    return new Response(
      JSON.stringify({ businessPlan }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in business-plan-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});