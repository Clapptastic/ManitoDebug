

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { OpenAIClient, RECOMMENDED_MODELS } from '../shared/openai-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getApiKey(supabase: any, userId: string, provider: string = 'openai') {
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('status', 'active')
    .eq('is_active', true)
    .single();

  if (error || !data?.api_key) {
    throw new Error(`API key not found for ${provider}`);
  }

  return data.api_key;
}

async function getUserContext(supabase: any, userId: string): Promise<string> {
  try {
    // Get user's competitor analyses
    const { data: analyses } = await supabase
      .from('competitor_analyses')
      .select('name, industry, description, strengths, weaknesses, opportunities, threats, market_position, business_model, target_market, pricing_strategy, funding_info, financial_metrics, key_personnel')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(10);

    // Get user's documents
    const { data: documents } = await supabase
      .from('documents')
      .select('title, description, category, tags')
      .eq('user_id', userId)
      .limit(20);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, preferences')
      .eq('id', userId)
      .maybeSingle();

    // Build context summary
    let contextSummary = "=== USER BUSINESS CONTEXT ===\n\n";
    
    if (profile) {
      contextSummary += `User: ${profile.full_name}\n`;
      if (profile.preferences?.company) {
        contextSummary += `Company: ${profile.preferences.company}\n`;
      }
    }

    if (analyses && analyses.length > 0) {
      contextSummary += "\n=== COMPETITOR ANALYSIS DATA ===\n";
      analyses.forEach((analysis: any) => {
        contextSummary += `\nCompetitor: ${analysis.name}\n`;
        if (analysis.industry) contextSummary += `Industry: ${analysis.industry}\n`;
        if (analysis.description) contextSummary += `Description: ${analysis.description}\n`;
        if (analysis.market_position) contextSummary += `Market Position: ${analysis.market_position}\n`;
        if (analysis.business_model) contextSummary += `Business Model: ${analysis.business_model}\n`;
        if (analysis.strengths?.length) contextSummary += `Strengths: ${analysis.strengths.join(', ')}\n`;
        if (analysis.weaknesses?.length) contextSummary += `Weaknesses: ${analysis.weaknesses.join(', ')}\n`;
        if (analysis.opportunities?.length) contextSummary += `Opportunities: ${analysis.opportunities.join(', ')}\n`;
        if (analysis.threats?.length) contextSummary += `Threats: ${analysis.threats.join(', ')}\n`;
        if (analysis.target_market?.length) contextSummary += `Target Market: ${analysis.target_market.join(', ')}\n`;
        if (analysis.funding_info && typeof analysis.funding_info === 'object') {
          const funding = analysis.funding_info as any;
          if (funding.total_funding) contextSummary += `Funding: ${funding.total_funding}\n`;
        }
        if (analysis.key_personnel && typeof analysis.key_personnel === 'object') {
          contextSummary += `Key Personnel: ${JSON.stringify(analysis.key_personnel)}\n`;
        }
        contextSummary += "---\n";
      });
    }

    if (documents && documents.length > 0) {
      contextSummary += "\n=== DOCUMENT LIBRARY ===\n";
      const categories = new Map();
      documents.forEach((doc: any) => {
        const category = doc.category || 'general';
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push(doc);
      });

      categories.forEach((docs, category) => {
        contextSummary += `\n${category.toUpperCase()} Documents:\n`;
        docs.forEach((doc: any) => {
          contextSummary += `- ${doc.title}`;
          if (doc.description) contextSummary += `: ${doc.description}`;
          if (doc.tags?.length) contextSummary += ` [${doc.tags.join(', ')}]`;
          contextSummary += "\n";
        });
      });
    }

    contextSummary += "\n=== INSTRUCTIONS ===\n";
    contextSummary += "You are an AI business advisor with full access to the user's business data above. ";
    contextSummary += "Use this context to provide highly personalized and relevant advice. ";
    contextSummary += "Reference specific competitors, documents, and business data when relevant. ";
    contextSummary += "Help with strategic planning, competitive positioning, and business growth. ";
    contextSummary += "Always maintain confidentiality and provide actionable insights based on the available data. ";
    contextSummary += "CRITICAL: When making claims or citing data, provide specific source citations with URLs when available. ";
    contextSummary += "Include source citations in your responses using the format: [Source: Name - URL] when referencing external data.\n";

    return contextSummary;
  } catch (error) {
    console.error('Error building user context:', error);
    return "=== USER BUSINESS CONTEXT ===\nContext data temporarily unavailable. Providing general business advice.\n";
  }
}

async function trackApiUsage(supabase: { from: (table: string) => any }, userId: string, provider: string, model: string, tokensUsed: number = 0, responseTime: number = 0, status: number = 200, endpoint: string = 'chat', error: string | null = null) {
  try {
    // Estimate cost (very simplified)
    let cost = 0;
    if (provider === 'openai') {
      // Rough estimate for GPT-4
      if (model.includes('gpt-4')) {
        cost = (tokensUsed / 1000) * 0.06; // $0.06 per 1K tokens for GPT-4
      } else {
        cost = (tokensUsed / 1000) * 0.002; // $0.002 per 1K tokens for GPT-3.5
      }
    }

    // Conform to api_metrics schema; store details in metadata
    await supabase
      .from('api_metrics')
      .insert({
        user_id: userId,
        endpoint,
        method: 'POST',
        status_code: status,
        response_time_ms: responseTime,
        metadata: {
          provider,
          model,
          tokens_used: tokensUsed,
          cost_usd: cost,
          error
        }
      });
  } catch (err) {
    console.error('Error tracking API usage:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { messages, model = RECOMMENDED_MODELS.FLAGSHIP, temperature = 0.7, max_tokens = 1500, provider = 'openai' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🤖 Processing chat request for ${provider} ${model}`);

    // Get the user's API key from the database
    const apiKey = await getApiKey(supabase, user.id, provider);
    
    // Get user's business context
    const userContext = await getUserContext(supabase, user.id);
    console.log('📊 Built user context:', userContext.length, 'characters');
    
    // Enhance messages with user context
    const contextualMessages = [
      {
        role: 'system',
        content: userContext
      },
      ...messages
    ];

    // Start timing the request
    const startTime = Date.now();

    // Determine API endpoint based on provider
    let apiUrl = 'https://api.openai.com/v1/chat/completions';
    let requestHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (provider === 'anthropic') {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      requestHeaders = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      };
    }

    // Build request body based on provider
    let requestBody: any;
    if (provider === 'anthropic') {
      // Convert OpenAI format to Anthropic format
      const systemMessage = contextualMessages.find(m => m.role === 'system');
      const conversationMessages = contextualMessages.filter(m => m.role !== 'system');
      
      requestBody = {
        model: model,
        max_tokens: max_tokens,
        messages: conversationMessages,
        system: systemMessage?.content || 'You are a helpful business advisor.'
      };
    } else {
      // Use standardized OpenAI client
      try {
        const openaiClient = new OpenAIClient(apiKey);
        const openaiResponse = await openaiClient.createChatCompletion({
          model: model || RECOMMENDED_MODELS.FLAGSHIP,
          messages: contextualMessages,
          temperature,
          max_tokens
        });
        
        // Track the successful API call
        await trackApiUsage(
          supabase,
          user.id,
          provider,
          model,
          openaiResponse.usage?.total_tokens || 0,
          Date.now() - startTime,
          200,
          'chat',
          null
        );
        
        return new Response(
          JSON.stringify(openaiResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        
        await trackApiUsage(
          supabase,
          user.id,
          provider,
          model,
          0,
          Date.now() - startTime,
          500,
          'chat',
          openaiError instanceof Error ? openaiError.message : 'OpenAI error'
        );
        
        throw openaiError;
      }
    }

    // For Anthropic - keep existing fetch logic
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
    // Track the failed API call
      await trackApiUsage(
        supabase,
        user.id,
        provider,
        model,
        0,
        responseTime,
        response.status,
        'chat',
        errorData?.error?.message || `HTTP error ${response.status}`
      );
      
      // Check if it's an API key issue
      if (response.status === 401) {
        // Update API key status
        try {
          await supabase
            .from('api_status_checks')
            .upsert({
              user_id: user.id,
              provider: provider,
              status: 'error',
              checked_at: new Date().toISOString()
            });
        } catch (e) {
          console.warn('api_status_checks upsert skipped:', e instanceof Error ? e.message : String(e));
        }
          
        return new Response(
          JSON.stringify({ 
            error: `Your ${provider} API key appears to be invalid. Please check your API key in Settings.`,
            code: 'INVALID_API_KEY'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`${provider} API error: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Normalize response format
    let normalizedResponse;
    if (provider === 'anthropic') {
      normalizedResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: data.content?.[0]?.text || 'No response content'
          }
        }],
        usage: {
          total_tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0
        }
      };
    } else {
      normalizedResponse = data;
    }
    
    // Track the successful API call
    await trackApiUsage(
      supabase,
      user.id,
      provider,
      model,
      normalizedResponse.usage?.total_tokens || 0,
      responseTime,
      200,
      'chat',
      null
    );
    
    // Update API key status as working
    try {
      await supabase
        .from('api_status_checks')
        .upsert({
          user_id: user.id,
          provider: provider,
          status: 'working',
          checked_at: new Date().toISOString()
        });
    } catch (e) {
      console.warn('api_status_checks upsert skipped:', e instanceof Error ? e.message : String(e));
    }

    return new Response(
      JSON.stringify(normalizedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in secure-openai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
