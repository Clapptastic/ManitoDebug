import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin/super admin
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id_param: user.id });
    if (!['admin', 'super_admin'].includes(roleData)) {
      throw new Error('Admin access required');
    }

    const { operation, fileData, options } = await req.json();

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
      throw new Error('No active OpenAI API key found for this user. Please add your OpenAI API key in Settings.');
    }

    const openAIApiKey = apiKeysResponse.api_key;

    switch (operation) {
      case 'process_codebase':
        return await processCodebase(supabase, user.id, options, openAIApiKey);
      case 'process_file':
        return await processFile(supabase, user.id, fileData, openAIApiKey);
      case 'batch_process':
        return await batchProcess(supabase, user.id, fileData, openAIApiKey);
      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in process-application-embeddings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCodebase(supabase: any, userId: string, options: any, openAIApiKey: string) {
  console.log('Processing entire codebase for user:', userId);
  
  try {
    // First, get all existing code embeddings for this user to identify files to process
    const { data: existingEmbeddings, error: fetchError } = await supabase
      .from('code_embeddings')
      .select('file_path, updated_at, content, id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Error fetching existing embeddings:', fetchError);
      throw new Error('Failed to fetch existing embeddings');
    }

    console.log(`Found ${existingEmbeddings?.length || 0} existing embeddings`);

    // Process the existing files and enhance their embeddings
    const processedFiles = [];
    const errors = [];

    if (existingEmbeddings && existingEmbeddings.length > 0) {
      for (const embedding of existingEmbeddings) {
        try {
          if (!embedding.content) {
            console.log(`Skipping ${embedding.file_path} - no content found`);
            continue;
          }

          // Re-process with enhanced metadata and ensure embedding is up to date
          const result = await processFile(
            supabase, 
            userId, 
            {
              filePath: embedding.file_path,
              content: embedding.content,
              language: detectLanguage(embedding.file_path)
            }, 
            openAIApiKey
          );

          processedFiles.push({
            path: embedding.file_path,
            status: 'processed',
            tokens: result.tokens || 0
          });

        } catch (fileError) {
          console.error(`Error processing ${embedding.file_path}:`, fileError);
          errors.push({
            path: embedding.file_path,
            error: fileError.message
          });
        }
      }
    } else {
      console.log('No existing embeddings found. Use "Index App Codebase" first to upload files.');
    }

    console.log(`Processed ${processedFiles.length} files with ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedFiles.length} files`,
        processedFiles,
        errors,
        summary: {
          total: processedFiles.length,
          failed: errors.length,
          totalTokens: processedFiles.reduce((sum, f) => sum + (f.tokens || 0), 0)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in processCodebase:', error);
    throw error;
  }
}

// Helper function to detect programming language from file path
function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript', 
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'rb': 'ruby',
    'php': 'php',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'sol': 'solidity'
  };
  return languageMap[ext || ''] || 'text';
}

async function processFile(supabase: any, userId: string, fileData: any, openAIApiKey: string) {
  const { filePath, content, language } = fileData;
  
  try {
    console.log(`Processing single file: ${filePath}`);
    
    const result = await generateEmbedding(content, openAIApiKey);
    
    const { data, error } = await supabase
      .from('code_embeddings')
      .upsert({
        user_id: userId,
        file_path: filePath,
        content,
        language: language || detectLanguage(filePath),
        embedding: result.embedding,
        token_count: result.tokenCount,
        metadata: {
          processed_at: new Date().toISOString(),
          single_file_upload: true,
          model: 'text-embedding-3-small',
          file_size_bytes: new Blob([content]).size,
          lines_of_code: content.split('\n').length
        }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      file_path: filePath,
      tokens: result.tokenCount,
      embedding_id: data?.id
    };

  } catch (error) {
    throw new Error(`Failed to process file ${filePath}: ${error.message}`);
  }
}

async function batchProcess(supabase: any, userId: string, files: any[], openAIApiKey: string) {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await processFile(supabase, userId, file, openAIApiKey);
      results.push(result);
    } catch (error) {
      results.push({ error: error.message, file_path: file.filePath });
    }
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateEmbedding(text: string, apiKey: string): Promise<{ embedding: number[]; tokenCount: number }> {
  const usedKey = apiKey?.trim();
  if (!usedKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${usedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit input length
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const data = await response.json();
  const embedding = (data?.data?.[0]?.embedding ?? []) as number[];
  const tokenCount = (data?.usage?.prompt_tokens as number | undefined) ?? Math.ceil(text.length / 4);
  if (!embedding || embedding.length === 0) {
    throw new Error('OpenAI API returned no embedding');
  }
  return { embedding, tokenCount };
}