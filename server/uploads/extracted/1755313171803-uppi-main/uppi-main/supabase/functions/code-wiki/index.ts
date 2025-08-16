import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json();

    switch (action) {
      case 'getService':
        const service = await getWikiService();
        return new Response(
          JSON.stringify(service),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'getDocumentation':
        const docs = await getDocumentation(supabase);
        return new Response(
          JSON.stringify(docs),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'searchDocs':
        const { query } = await req.json();
        const searchResults = await searchDocumentation(supabase, query);
        return new Response(
          JSON.stringify(searchResults),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in code-wiki:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getWikiService() {
  return {
    service_name: 'Code Wiki System',
    version: '1.0.0',
    documentation_url: '/admin/wiki',
    status: 'running',
    features: ['Code documentation', 'Search', 'Syntax highlighting', 'Version control']
  };
}

async function getDocumentation(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (error) {
      // Return default documentation if table doesn't exist
      return [{
        id: '1',
        title: 'Code Wiki Documentation',
        content: `# Code Wiki System

The Code Wiki system allows developers to document code and share knowledge across the team.

## Features

- **Markdown Support**: Write documentation using markdown syntax
- **Code Highlighting**: Syntax highlighting for multiple programming languages
- **Search**: Full-text search across all documentation
- **Version Control**: Track changes and maintain documentation history

## Getting Started

1. Navigate to the Wiki section in the admin panel
2. Create new documentation or edit existing entries
3. Use markdown formatting for rich text content
4. Tag your documentation for better organization

## Best Practices

- Keep documentation up to date with code changes
- Use clear, descriptive titles
- Include code examples where relevant
- Tag content appropriately for discoverability`,
        category: 'system',
        tags: ['wiki', 'documentation', 'getting-started'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_published: true
      }];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching documentation:', error);
    throw error;
  }
}

async function searchDocumentation(supabase: any, query: string) {
  try {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      // Return empty results if table doesn't exist or search fails
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching documentation:', error);
    return [];
  }
}