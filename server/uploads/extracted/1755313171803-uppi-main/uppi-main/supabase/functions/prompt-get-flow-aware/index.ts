import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseAdmin } from '../shared/supabase-admin.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlowAwarePromptRequest {
  key: string;
  flowName?: string;
  fallbackToGlobal?: boolean;
}

interface FlowAwarePromptResponse {
  key: string;
  provider: string;
  domain: string;
  description: string | null;
  is_active: boolean;
  version: number | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  variables: unknown[];
  updated_at: string | null;
  source: 'flow-assigned' | 'fallback' | 'cache';
  flow_assignment?: {
    flow_id: string;
    flow_name: string;
    priority: number;
    assigned_at: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let requestData: FlowAwarePromptRequest;
  
  try {
    requestData = await req.json();
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid JSON in request body',
        source: 'error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const { key, flowName, fallbackToGlobal = true } = requestData;

  if (!key) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required parameter: key',
        source: 'error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const supabase = createSupabaseAdmin();

  try {
    let response: FlowAwarePromptResponse | null = null;
    let source: 'flow-assigned' | 'fallback' | 'cache' = 'fallback';

    // If flowName is provided, try flow-specific lookup first
    if (flowName) {
      console.log(`Looking for prompt "${key}" in flow "${flowName}"`);
      
      const { data: flowAssignment, error: flowError } = await supabase
        .from('prompt_flows')
        .select(`
          *,
          prompt:prompts!inner(*),
          flow:flow_definitions!inner(*),
          version:prompts!inner(current_version_id),
          prompt_version:prompts!inner(
            prompt_versions!inner(*)
          )
        `)
        .eq('prompt_flows.is_active_in_flow', true)
        .eq('flow_definitions.name', flowName)
        .eq('flow_definitions.is_active', true)
        .eq('prompts.key', key)
        .eq('prompts.is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (!flowError && flowAssignment) {
        const prompt = flowAssignment.prompt;
        const version = flowAssignment.prompt_version?.prompt_versions?.[0];
        
        response = {
          key: prompt.key,
          provider: prompt.provider,
          domain: prompt.domain,
          description: prompt.description,
          is_active: prompt.is_active,
          version: version?.version || null,
          content: version?.content || null,
          metadata: version?.metadata || prompt.metadata || {},
          variables: [], // TODO: Extract from content or metadata
          updated_at: prompt.updated_at,
          source: 'flow-assigned',
          flow_assignment: {
            flow_id: flowAssignment.flow_id,
            flow_name: flowAssignment.flow.name,
            priority: flowAssignment.priority,
            assigned_at: flowAssignment.assigned_at
          }
        };
        source = 'flow-assigned';
        
        console.log(`Found flow-assigned prompt for "${key}" in flow "${flowName}"`);
      } else {
        console.log(`No flow-assigned prompt found for "${key}" in flow "${flowName}"`);
      }
    }

    // Fallback to global prompt lookup if no flow assignment found
    if (!response && fallbackToGlobal) {
      console.log(`Falling back to global lookup for prompt "${key}"`);
      
      const { data: globalPrompt, error: globalError } = await supabase
        .from('prompts')
        .select(`
          *,
          prompt_versions!inner(*)
        `)
        .eq('key', key)
        .eq('is_active', true)
        .eq('prompt_versions.id', supabase.raw('prompts.current_version_id'))
        .single();

      if (!globalError && globalPrompt) {
        const version = globalPrompt.prompt_versions[0];
        
        response = {
          key: globalPrompt.key,
          provider: globalPrompt.provider,
          domain: globalPrompt.domain,
          description: globalPrompt.description,
          is_active: globalPrompt.is_active,
          version: version?.version || null,
          content: version?.content || null,
          metadata: version?.metadata || globalPrompt.metadata || {},
          variables: [], // TODO: Extract from content or metadata
          updated_at: globalPrompt.updated_at,
          source: 'fallback'
        };
        source = 'fallback';
        
        console.log(`Found global fallback prompt for "${key}"`);
      }
    }

    // Log execution for analytics
    const executionTime = Date.now() - startTime;
    try {
      await supabase.rpc('log_ai_prompt', {
        provider_param: 'system',
        model_param: 'prompt-get-flow-aware',
        prompt_param: `Key: ${key}, Flow: ${flowName || 'none'}`,
        prompt_length_param: key.length,
        session_id_param: `flow-${flowName || 'global'}`,
        status_param: response ? 'success' : 'not_found',
        metadata_param: {
          key,
          flow_name: flowName,
          source,
          execution_time_ms: executionTime,
          found: !!response
        }
      });
    } catch (logError) {
      console.warn('Failed to log prompt execution:', logError);
    }

    if (response) {
      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Prompt not found: ${key}`,
          key,
          flowName,
          source: 'not-found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in prompt-get-flow-aware function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        source: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});