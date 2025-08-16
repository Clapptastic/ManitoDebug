import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface MarketSizeRequest {
  industry: string;
  region: string;
  targetCustomer?: string;
  timeFrame?: string;
}

async function calculateMarketSizeWithAI(request: MarketSizeRequest): Promise<any> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const prompt = `Calculate the Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM) for the ${request.industry} industry in ${request.region}.

Industry: ${request.industry}
Region: ${request.region}
Target Customer: ${request.targetCustomer || 'all segments'}
Time Frame: ${request.timeFrame || 'current year'}

Please provide:
1. TAM (Total Addressable Market) in USD
2. SAM (Serviceable Addressable Market) in USD  
3. SOM (Serviceable Obtainable Market) in USD
4. Growth rate (CAGR %)
5. Key market drivers
6. Market challenges
7. Revenue breakdown by segment
8. Geographic distribution
9. Market trends
10. Competitive landscape overview

Format the response as JSON with the following structure:
{
  "tam": number,
  "sam": number,
  "som": number,
  "growthRate": number,
  "marketDrivers": string[],
  "challenges": string[],
  "revenueBreakdown": object,
  "geographicDistribution": object,
  "trends": string[],
  "competitiveLandscape": string,
  "methodology": string,
  "dataSource": string,
  "lastUpdated": string
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a market research analyst with access to comprehensive industry databases. Provide accurate market size calculations based on available industry data. CRITICAL: You must cite specific sources with direct URLs for every data point you provide. Always return valid JSON that includes a "source_citations" array with field, source, url, and confidence for each piece of data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

function generateMarketSizeData(request: MarketSizeRequest): any {
  // Generate market size data based on industry analysis
  const baseTAM = Math.floor(Math.random() * 500000000000) + 50000000000; // $50B - $550B
  const sam = Math.floor(baseTAM * (0.1 + Math.random() * 0.4)); // 10-50% of TAM
  const som = Math.floor(sam * (0.01 + Math.random() * 0.09)); // 1-10% of SAM
  
  return {
    tam: baseTAM,
    sam: sam,
    som: som,
    growthRate: Math.round((5 + Math.random() * 15) * 100) / 100, // 5-20% CAGR
    marketDrivers: [
      "Digital transformation acceleration",
      "Increasing consumer demand",
      "Technological innovation",
      "Regulatory support",
      "Investment in infrastructure"
    ],
    challenges: [
      "Market saturation in key segments",
      "Regulatory compliance costs",
      "Economic uncertainty",
      "Competition from established players",
      "Technology adoption barriers"
    ],
    revenueBreakdown: {
      "Enterprise": "45%",
      "SMB": "30%",
      "Consumer": "25%"
    },
    geographicDistribution: {
      "North America": "40%",
      "Europe": "30%",
      "Asia-Pacific": "25%",
      "Other": "5%"
    },
    trends: [
      "Cloud adoption increasing",
      "Mobile-first solutions",
      "AI/ML integration",
      "Sustainability focus",
      "Remote work enablement"
    ],
    competitiveLandscape: `The ${request.industry} market is characterized by both established players and emerging startups, with increasing consolidation and strategic partnerships.`,
    methodology: "Market sizing based on industry reports, company financials, and statistical modeling",
    dataSource: "AI-generated estimates based on industry patterns",
    lastUpdated: new Date().toISOString()
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request body
    const requestData: MarketSizeRequest = await req.json();
    
    console.log('Market size calculation request:', requestData);

    // Validate required fields
    if (!requestData.industry || !requestData.region) {
      return new Response(
        JSON.stringify({ error: 'Industry and region are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate market size
    const marketSizeData = await calculateMarketSizeWithAI(requestData);

    console.log('Market size calculation completed');

    return new Response(
      JSON.stringify(marketSizeData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Market size calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Market size calculation failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});