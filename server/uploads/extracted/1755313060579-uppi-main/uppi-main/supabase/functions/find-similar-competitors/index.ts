
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { analysisId, userId } = await req.json();
    
    // Validate required parameters
    if (!analysisId) {
      return new Response(
        JSON.stringify({ error: 'Analysis ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the competitor analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();
    
    if (analysisError) {
      return new Response(
        JSON.stringify({ error: `Error fetching analysis: ${analysisError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get similar competitors based on industry, growth stage, and market share
    const { data: similarCompetitors, error: similarError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('user_id', userId)
      .neq('id', analysisId)  // Exclude current competitor
      .is('deleted_at', null)  // Only include non-deleted competitors
      .order('created_at', { ascending: false })
      .limit(5);

    if (similarError) {
      return new Response(
        JSON.stringify({ error: `Error fetching similar competitors: ${similarError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // If we have AI API keys available, we could use them to better compute similarity scores
    // For now, we'll use a simple approach
    
    // Calculate similarity scores
    const similarWithScores = similarCompetitors.map((competitor) => {
      // A simple heuristic for similarity score
      let similarityScore = 0.5; // Base score
      
      // Increase score for matching properties
      if (competitor.growth_stage === analysis.growth_stage) similarityScore += 0.15;
      if (competitor.position_type === analysis.position_type) similarityScore += 0.15;
      
      // Adjust score based on market share similarity
      if (competitor.market_share !== null && analysis.market_share !== null) {
        const marketShareDiff = Math.abs(competitor.market_share - analysis.market_share);
        if (marketShareDiff < 5) similarityScore += 0.1;
        else if (marketShareDiff < 10) similarityScore += 0.05;
      }
      
      // Add the score to the competitor object
      return {
        ...competitor,
        similarity_score: similarityScore
      };
    });
    
    // Sort by similarity score
    const sortedSimilar = similarWithScores.sort((a, b) => b.similarity_score - a.similarity_score);
    
    // Update the original analysis with computed similar competitors
    await supabase
      .from('competitor_analyses')
      .update({
        computed_similar_competitors: sortedSimilar,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    return new Response(
      JSON.stringify({
        similar_competitors: sortedSimilar
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
