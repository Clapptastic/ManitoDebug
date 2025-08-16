
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
    // Parse the request body
    const { type, repository, accessToken, branch, content } = await req.json();
    
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
    
    // Handle different request types
    if (type === 'setup') {
      // Set up GitHub webhook
      const webhookSecret = crypto.randomUUID();
      const webhookUrl = `${supabaseUrl}/functions/v1/github-code-embed`;
      
      // Store webhook details in the database for future reference
      // This could be in a webhooks table or user metadata
      
      return new Response(
        JSON.stringify({
          success: true,
          manualSetupRequired: !accessToken,
          webhookUrl,
          webhookSecret,
          message: 'GitHub webhook setup complete'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'webhook') {
      // Process GitHub webhook payload
      // Get the files that were changed in this push
      // This would involve parsing GitHub event payload and fetching changed files
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook received'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'manual') {
      // Handle manual file upload
      if (!content?.filePath || !content?.fileContent) {
        throw new Error('Missing file path or content');
      }
      
      // Process the code file
      const fileData = await processCodeFile(
        content.filePath,
        content.fileContent,
        user.id,
        supabase
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'File processed successfully',
          file: fileData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid request type');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to process a code file and generate embeddings
async function processCodeFile(
  filePath: string,
  content: string,
  userId: string,
  supabase: any
) {
  try {
    // Get user's OpenAI API key
    const { data: apiKeys, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('key_type', 'openai')
      .eq('status', 'active')
      .maybeSingle();
    
    if (keyError) {
      throw new Error(`Error fetching API key: ${keyError.message}`);
    }
    
    if (!apiKeys?.api_key) {
      throw new Error('No active OpenAI API key found for this user');
    }
    
    // Set up OpenAI client
    const configuration = new Configuration({ apiKey: apiKeys.api_key });
    const openai = new OpenAIApi(configuration);
    
    console.log(`Generating embedding for file: ${filePath}`);
    const startTime = Date.now();

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: content.slice(0, 8000), // Limiting to 8000 chars as a safety measure
    });

    const embedding = embeddingResponse.data.data[0].embedding;
    const tokenCount = embeddingResponse.data.usage.total_tokens;
    const processingTime = Date.now() - startTime;
    
    // Determine file extension
    const fileExt = filePath.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Create metadata for the embedding
    const metadata = {
      file_extension: fileExt,
      chars_processed: Math.min(content.length, 8000),
      total_chars: content.length,
      embedding_model: "text-embedding-ada-002",
      source: "manual-upload"
    };

    // Store in database
    const { data: existingFile, error: fetchError } = await supabase
      .from('code_embeddings')
      .select('id')
      .eq('file_path', filePath)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    let result;
    
    if (existingFile) {
      // Update existing record
      const { data, error } = await supabase
        .from('code_embeddings')
        .update({
          content,
          embedding,
          embedding_model: "text-embedding-ada-002",
          token_count: tokenCount,
          processing_time_ms: processingTime,
          updated_at: new Date().toISOString(),
          metadata
        })
        .eq('id', existingFile.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
      console.log(`Updated embedding for file: ${filePath}`);
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('code_embeddings')
        .insert({
          file_path: filePath,
          content,
          embedding,
          embedding_model: "text-embedding-ada-002",
          token_count: tokenCount,
          processing_time_ms: processingTime,
          user_id: userId,
          metadata
        })
        .select()
        .single();
        
      if (error) throw error;
      result = data;
      console.log(`Created new embedding for file: ${filePath}`);
    }

    // Create history record
    await supabase
      .from('code_embedding_history')
      .insert({
        file_path: filePath,
        user_id: userId,
        embedding_id: result.id
      });

    return result;
  } catch (error) {
    console.error('Error processing code file:', error);
    throw error;
  }
}
