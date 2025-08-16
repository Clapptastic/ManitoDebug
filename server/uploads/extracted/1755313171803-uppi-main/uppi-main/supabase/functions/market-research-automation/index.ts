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
    const { industry, region = 'Global', targetMarket = '' } = await req.json();

    if (!industry) {
      return new Response(
        JSON.stringify({ error: 'Industry is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Conducting market research for: ${industry} in ${region}`);

    const prompt = `Conduct comprehensive market research for the ${industry} industry in ${region}${targetMarket ? ` focusing on ${targetMarket}` : ''}. 

    Return a detailed JSON object with the following structure:
    {
      "industry": "${industry}",
      "marketSize": {
        "global": "$X billion (2024)",
        "regional": "$X billion (${region})",
        "growth_rate": "X% CAGR (2024-2029)"
      },
      "targetAudience": {
        "demographics": ["Age: 25-45", "Income: $50-100k", "Education: College+"],
        "psychographics": ["Tech-savvy", "Value-conscious", "Early adopters"],
        "painPoints": ["High costs", "Complex solutions", "Poor user experience"]
      },
      "competitorLandscape": {
        "directCompetitors": ["Company A", "Company B", "Company C"],
        "indirectCompetitors": ["Alternative A", "Alternative B"],
        "marketShare": {
          "Company A": "25%",
          "Company B": "20%",
          "Company C": "15%",
          "Others": "40%"
        }
      },
      "trends": {
        "emerging": ["AI integration", "Mobile-first", "Sustainability"],
        "declining": ["Legacy systems", "Manual processes"],
        "technologies": ["Machine Learning", "Cloud Computing", "IoT"]
      },
      "opportunities": {
        "gaps": ["Underserved SMB market", "Mobile solutions", "Integration needs"],
        "niches": ["Vertical-specific solutions", "Regional markets"],
        "underserved": ["Small businesses", "Rural markets", "Developing regions"]
      },
      "pricing": {
        "models": ["Subscription", "Freemium", "Enterprise"],
        "ranges": ["$10-50/month (SMB)", "$100-500/month (Mid-market)", "$1000+/month (Enterprise)"],
        "strategies": ["Value-based pricing", "Competitive pricing", "Penetration pricing"]
      },
      "insights": [
        "Market is experiencing rapid digital transformation",
        "Growing demand for integrated solutions",
        "Price sensitivity in SMB segment"
      ],
      "recommendations": [
        "Focus on mobile-first approach",
        "Develop vertical-specific features",
        "Implement freemium model for market penetration"
      ]
    }

    Provide current, accurate market data and realistic insights specific to the ${industry} industry. Include recent trends, competitive analysis, and actionable recommendations.`;

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
            content: 'You are a senior market research analyst with expertise in industry analysis, competitive intelligence, and market sizing. You have access to comprehensive market databases and must provide accurate, data-driven insights with specific source citations. CRITICAL: For every data point you provide, you must cite the specific source with direct URLs where that information can be verified. Always return valid JSON with a "source_citations" field containing an array of citations with field, source, url, and confidence for each data point.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let researchText = data.choices[0].message.content;

    // Extract JSON from the response
    const jsonMatch = researchText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    const research = JSON.parse(jsonMatch[0]);

    // Store the market research in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('market_research').insert({
          user_id: user.id,
          industry,
          region,
          target_market: targetMarket || null,
          research_data: research,
          status: 'completed'
        });
        
        console.log(`Market research stored for user: ${user.id}`);
      }
    }

    return new Response(
      JSON.stringify({ research }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in market-research-automation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});