import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionTest {
  name: string;
  url: string;
  requiresAuth: boolean;
  testPayload?: any;
  expectedKeys?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authentication from request
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      } as any);
    }

    const { action = 'test_all' } = await req.json().catch(() => ({}));

    console.log(`🔍 Debug Functions - Action: ${action}`);

    const results: any = {
      timestamp: new Date().toISOString(),
      action,
      environment: {
        supabase_url: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
        supabase_anon_key: Deno.env.get('SUPABASE_ANON_KEY') ? 'SET' : 'MISSING',
        openai_key: Deno.env.get('OPENAI_API_KEY') ? 'SET' : 'MISSING',
        anthropic_key: Deno.env.get('ANTHROPIC_API_KEY') ? 'SET' : 'MISSING',
        gemini_key: Deno.env.get('GEMINI_API_KEY') ? 'SET' : 'MISSING',
        perplexity_key: Deno.env.get('PERPLEXITY_API_KEY') ? 'SET' : 'MISSING',
        newsapi_key: Deno.env.get('NEWSAPI_KEY') ? 'SET' : 'MISSING',
      },
      tests: []
    };

    if (action === 'test_all' || action === 'test_secrets') {
      // Test secret retrieval
      console.log('🔐 Testing secret retrieval...');
      const secretsTest = await testSecretRetrieval(supabase);
      results.secrets = secretsTest;
    }

    if (action === 'test_all' || action === 'test_api_keys') {
      // Test API key management
      console.log('🔑 Testing API key management...');
      const apiKeysTest = await testApiKeyManagement(supabase);
      results.apiKeys = apiKeysTest;
    }

    if (action === 'test_all' || action === 'test_competitor_analysis') {
      // Test competitor analysis function
      console.log('🏢 Testing competitor analysis...');
      const competitorTest = await testCompetitorAnalysis(supabase);
      results.competitorAnalysis = competitorTest;
    }

    if (action === 'test_all' || action === 'test_external_apis') {
      // Test external API calls
      console.log('🌐 Testing external APIs...');
      const externalTest = await testExternalAPIs();
      results.externalAPIs = externalTest;
    }

    console.log('✅ Debug complete:', JSON.stringify(results, null, 2));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testSecretRetrieval(supabase: any) {
  const results: any = {
    status: 'success',
    tests: []
  };

  try {
    // Test unified API key manager
    const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('unified-api-key-manager', {
      body: { 
        action: 'decrypt',
        provider: 'openai'
      }
    });

    results.tests.push({
      name: 'unified-api-key-manager',
      success: !apiKeyError,
      data: apiKeyData,
      error: apiKeyError?.message
    });

  } catch (error) {
    results.tests.push({
      name: 'unified-api-key-manager',
      success: false,
      error: error.message
    });
  }

  return results;
}

async function testApiKeyManagement(supabase: any) {
  const results: any = {
    status: 'success',
    tests: []
  };

  try {
    // Test getting user API keys
    const { data: userKeys, error: userKeysError } = await supabase
      .rpc('manage_api_key', {
        operation: 'select',
        user_id_param: (await supabase.auth.getUser()).data.user?.id
      });

    results.tests.push({
      name: 'get_user_api_keys',
      success: !userKeysError,
      data: userKeys,
      error: userKeysError?.message
    });

    // Test API key validation
    if (userKeys && userKeys.length > 0) {
      for (const key of userKeys) {
        try {
          const { data: validateData, error: validateError } = await supabase.functions.invoke('validate-api-key', {
            body: {
              provider: key.provider,
              test_mode: true
            }
          });

          results.tests.push({
            name: `validate_${key.provider}_key`,
            success: !validateError,
            provider: key.provider,
            data: validateData,
            error: validateError?.message
          });
        } catch (error) {
          results.tests.push({
            name: `validate_${key.provider}_key`,
            success: false,
            provider: key.provider,
            error: error.message
          });
        }
      }
    }

  } catch (error) {
    results.status = 'error';
    results.error = error.message;
  }

  return results;
}

async function testCompetitorAnalysis(supabase: any) {
  const results: any = {
    status: 'success',
    tests: []
  };

  try {
    // Test competitor analysis gate
    const { data: gateData, error: gateError } = await supabase.functions.invoke('competitor-analysis-gate', {
      body: {
        action: 'check_providers'
      }
    });

    results.tests.push({
      name: 'competitor-analysis-gate',
      success: !gateError,
      data: gateData,
      error: gateError?.message
    });

    // Test small competitor analysis
    const testSessionId = `test-${Date.now()}`;
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke('competitor-analysis', {
      body: {
        action: 'start',
        sessionId: testSessionId,
        competitors: ['Test Company'],
        providers: ['openai'], // Only test with OpenAI if available
        options: {
          test_mode: true,
          max_retries: 1
        }
      }
    });

    results.tests.push({
      name: 'competitor-analysis-test',
      success: !analysisError,
      sessionId: testSessionId,
      data: analysisData,
      error: analysisError?.message
    });

  } catch (error) {
    results.status = 'error';
    results.error = error.message;
  }

  return results;
}

async function testExternalAPIs() {
  const results: any = {
    status: 'success',
    tests: []
  };

  // Test OpenAI API
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      results.tests.push({
        name: 'openai_api_test',
        success: openaiResponse.ok,
        status: openaiResponse.status,
        error: openaiResponse.ok ? null : `HTTP ${openaiResponse.status}`
      });
    } catch (error) {
      results.tests.push({
        name: 'openai_api_test',
        success: false,
        error: error.message
      });
    }
  } else {
    results.tests.push({
      name: 'openai_api_test',
      success: false,
      error: 'API key not found in environment'
    });
  }

  // Test Perplexity API
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (perplexityKey) {
    try {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });

      results.tests.push({
        name: 'perplexity_api_test',
        success: perplexityResponse.ok,
        status: perplexityResponse.status,
        error: perplexityResponse.ok ? null : await perplexityResponse.text()
      });
    } catch (error) {
      results.tests.push({
        name: 'perplexity_api_test',
        success: false,
        error: error.message
      });
    }
  }

  // Test Gemini API
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiKey) {
    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);

      results.tests.push({
        name: 'gemini_api_test',
        success: geminiResponse.ok,
        status: geminiResponse.status,
        error: geminiResponse.ok ? null : await geminiResponse.text()
      });
    } catch (error) {
      results.tests.push({
        name: 'gemini_api_test',
        success: false,
        error: error.message
      });
    }
  }

  // Test NewsAPI
  const newsApiKey = Deno.env.get('NEWSAPI_KEY');
  if (newsApiKey) {
    try {
      const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${newsApiKey}`);

      results.tests.push({
        name: 'newsapi_test',
        success: newsResponse.ok,
        status: newsResponse.status,
        error: newsResponse.ok ? null : await newsResponse.text()
      });
    } catch (error) {
      results.tests.push({
        name: 'newsapi_test',
        success: false,
        error: error.message
      });
    }
  }

  return results;
}