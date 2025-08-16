import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-api-key',
};

interface SearchQuery {
  query: string;
  limit?: number;
  similarity_threshold?: number;
  file_types?: string[];
  categories?: string[];
}

interface MCPRequest {
  method: string;
  params: {
    name: string;
    arguments: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication - support both JWT and API key auth
    const authResult = await authenticateRequest(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, authMethod } = authResult;

    // Handle MCP (Model Context Protocol) requests
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/vnd.mcp')) {
      return await handleMCPRequest(req, supabase, userId);
    }

    // Handle standard API requests
    const { operation, ...params } = await req.json();

    switch (operation) {
      case 'search':
        return await searchEmbeddings(supabase, userId, params);
      case 'get_file':
        return await getFile(supabase, userId, params.file_path);
      case 'list_files':
        return await listFiles(supabase, userId, params);
      case 'get_categories':
        return await getCategories(supabase, userId);
      case 'health_check':
        return await healthCheck(supabase, userId);
      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in secure-embeddings-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authenticateRequest(req: Request, supabase: any) {
  // Try API key authentication first (for IDEs/agents)
  const adminApiKey = req.headers.get('x-admin-api-key');
  if (adminApiKey) {
    const { data: apiKeyData } = await supabase
      .from('admin_api_keys')
      .select('created_by, is_active')
      .eq('key_hash', await hashApiKey(adminApiKey))
      .eq('is_active', true)
      .single();

    if (apiKeyData) {
      return { success: true, userId: apiKeyData.created_by, authMethod: 'api_key' };
    }
  }

  // Try JWT authentication
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { success: false, error: 'Missing authentication' };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    return { success: false, error: 'Invalid JWT token' };
  }

  // Check if user has admin privileges
  const { data: roleData } = await supabase.rpc('get_user_role', { user_id_param: user.id });
  if (!['admin', 'super_admin'].includes(roleData)) {
    return { success: false, error: 'Admin access required' };
  }

  return { success: true, userId: user.id, authMethod: 'jwt' };
}

async function handleMCPRequest(req: Request, supabase: any, userId: string) {
  const mcpRequest: MCPRequest = await req.json();
  
  switch (mcpRequest.params.name) {
    case 'search_code':
      return await searchEmbeddings(supabase, userId, mcpRequest.params.arguments);
    case 'get_file_content':
      return await getFile(supabase, userId, mcpRequest.params.arguments.file_path);
    case 'list_available_files':
      return await listFiles(supabase, userId, mcpRequest.params.arguments);
    default:
      throw new Error(`Unknown MCP method: ${mcpRequest.params.name}`);
  }
}

async function searchEmbeddings(supabase: any, userId: string, params: SearchQuery) {
  const { query, limit = 10, similarity_threshold = 0.7, file_types, categories } = params;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Perform similarity search
  let searchQuery = supabase.rpc('match_code_embeddings', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    similarity_threshold,
    match_count: limit,
    user_id_param: userId
  });

  const { data, error } = await searchQuery;

  if (error) throw error;

  // Filter by file types and categories if specified
  let filteredResults = data || [];
  
  if (file_types?.length) {
    filteredResults = filteredResults.filter((item: any) => 
      file_types.some(type => item.file_path.endsWith(`.${type}`))
    );
  }

  if (categories?.length) {
    filteredResults = filteredResults.filter((item: any) => 
      item.metadata && categories.includes(item.metadata.category)
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      results: filteredResults,
      query: query,
      total_results: filteredResults.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getFile(supabase: any, userId: string, filePath: string) {
  const { data, error } = await supabase
    .from('code_embeddings')
    .select('*')
    .eq('user_id', userId)
    .eq('file_path', filePath)
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, file_data: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listFiles(supabase: any, userId: string, params: any = {}) {
  const { category, language, limit = 100 } = params;

  let query = supabase
    .from('code_embeddings')
    .select('file_path, language, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;

  if (error) throw error;

  let filteredData = data || [];
  
  if (category) {
    filteredData = filteredData.filter((item: any) => 
      item.metadata && item.metadata.category === category
    );
  }

  return new Response(
    JSON.stringify({ success: true, files: filteredData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getCategories(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('code_embeddings')
    .select('metadata')
    .eq('user_id', userId);

  if (error) throw error;

  const categories = new Set();
  const languages = new Set();

  data?.forEach((item: any) => {
    if (item.metadata?.category) {
      categories.add(item.metadata.category);
    }
  });

  const { data: langData } = await supabase
    .from('code_embeddings')
    .select('language')
    .eq('user_id', userId);

  langData?.forEach((item: any) => {
    if (item.language) {
      languages.add(item.language);
    }
  });

  return new Response(
    JSON.stringify({
      success: true,
      categories: Array.from(categories),
      languages: Array.from(languages)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function healthCheck(supabase: any, userId: string) {
  const { data: count } = await supabase
    .from('code_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({
      success: true,
      status: 'healthy',
      embeddings_count: count || 0,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}