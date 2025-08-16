
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodeEmbeddingRequest {
  content: string;
  filePath: string;
  language?: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const effectiveUserId = user.id;

    const { content, filePath, language }: CodeEmbeddingRequest = await req.json();

    if (!content || !filePath) {
      throw new Error('Content and file path are required');
    }

    // Fetch admin OpenAI API key (service role access)
    const { data: adminKeyRow, error: adminKeyErr } = await supabaseClient
      .from('admin_api_keys')
      .select('id, api_key')
      .eq('provider', 'openai')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (adminKeyErr || !adminKeyRow?.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin OpenAI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const openAIApiKey = adminKeyRow.api_key;

    console.log(`Generating embeddings for file: ${filePath}`);

    // Generate embeddings using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content,
        encoding_format: 'float'
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;
    const tokenCount = (embeddingData.usage?.prompt_tokens ?? embeddingData.usage?.total_tokens ?? Math.ceil(content.length / 4));

    // Store embedding in database
    const { data, error } = await supabaseClient
      .from('code_embeddings')
      .upsert({
        user_id: effectiveUserId,
        file_path: filePath,
        content: content,
        embedding: embedding,
        language: language || 'unknown',
        token_count: tokenCount,
        metadata: {
          model: 'text-embedding-3-small',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to store embedding in database');
    }

    console.log(`Successfully generated embeddings for ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        embedding_id: data.id,
        token_count: tokenCount,
        file_path: filePath
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in code-embeddings function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});