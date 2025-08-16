
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, threshold = 0.7, limit = 5 } = await req.json();
    
    if (!query) {
      throw new Error('Query parameter is required');
    }
    
    // Set up Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authentication details
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token to get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }
    
    // Get user's OpenAI API key using the secure RPC function
    const { data: apiKeysResponse, error: keyError } = await supabase.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: user.id,
      provider_param: 'openai'
    });
    
    if (keyError) {
      throw new Error(`Error fetching API key: ${keyError.message}`);
    }
    
    if (!apiKeysResponse?.api_key) {
      throw new Error('No active OpenAI API key found for this user');
    }
    
    // Set up OpenAI client
    const configuration = new Configuration({ apiKey: apiKeysResponse.api_key });
    const openai = new OpenAIApi(configuration);
    
    // Generate embedding for the query
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data.data[0].embedding;
    const queryTokens = embeddingResponse.data.usage.total_tokens;
    
    // Search for similar code using vector similarity
    const { data: matches, error: searchError } = await supabase.rpc('match_code_embeddings', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      similarity_threshold: threshold,
      match_count: limit,
      user_id_param: user.id
    });
    
    if (searchError) {
      throw new Error(`Error searching embeddings: ${searchError.message}`);
    }
    
    // Return the matches
    return new Response(
      JSON.stringify({
        success: true,
        matches,
        query_tokens: queryTokens
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing search:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
