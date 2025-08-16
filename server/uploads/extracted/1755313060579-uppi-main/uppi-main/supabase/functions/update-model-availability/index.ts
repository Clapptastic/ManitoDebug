import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelAvailability {
  provider: string;
  modelId: string;
  isAvailable: boolean;
  lastChecked: string;
  error?: string;
}

interface ProviderTestResult {
  provider: string;
  availableModels: string[];
  unavailableModels: string[];
  error?: string;
}

/**
 * Test OpenAI model availability
 */
async function testOpenAIModels(apiKey: string): Promise<ProviderTestResult> {
  try {
    // Get available models from OpenAI
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const availableModelIds = data.data.map((model: any) => model.id);
    
    // Models we care about tracking
    const trackedModels = [
      'gpt-4.1-2025-04-14',
      'o3-2025-04-16', 
      'o4-mini-2025-04-16',
      'gpt-4.1-mini-2025-04-14',
      'gpt-4',
      'gpt-4-vision-preview',
      'gpt-4o',
      'gpt-4o-mini'
    ];

    const availableModels = trackedModels.filter(model => availableModelIds.includes(model));
    const unavailableModels = trackedModels.filter(model => !availableModelIds.includes(model));

    return {
      provider: 'openai',
      availableModels,
      unavailableModels
    };
  } catch (error) {
    return {
      provider: 'openai',
      availableModels: [],
      unavailableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Anthropic model availability
 */
async function testAnthropicModels(apiKey: string): Promise<ProviderTestResult> {
  try {
    // Test with a simple request to check model availability
    const testModels = [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514', 
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-5-sonnet-20241022'
    ];

    const availableModels: string[] = [];
    const unavailableModels: string[] = [];

    for (const model of testModels) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });

        if (response.ok || response.status === 400) {
          // 400 is expected for minimal request, means model exists
          availableModels.push(model);
        } else if (response.status === 404) {
          unavailableModels.push(model);
        }
      } catch {
        unavailableModels.push(model);
      }
    }

    return {
      provider: 'anthropic',
      availableModels,
      unavailableModels
    };
  } catch (error) {
    return {
      provider: 'anthropic',
      availableModels: [],
      unavailableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Perplexity model availability
 */
async function testPerplexityModels(apiKey: string): Promise<ProviderTestResult> {
  try {
    const testModels = [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online'
    ];

    const availableModels: string[] = [];
    const unavailableModels: string[] = [];

    for (const model of testModels) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 1
          })
        });

        if (response.ok || response.status === 400) {
          availableModels.push(model);
        } else if (response.status === 404) {
          unavailableModels.push(model);
        }
      } catch {
        unavailableModels.push(model);
      }
    }

    return {
      provider: 'perplexity',
      availableModels,
      unavailableModels
    };
  } catch (error) {
    return {
      provider: 'perplexity',
      availableModels: [],
      unavailableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`🔄 Starting model availability check for user: ${user.id}`);

    // Get user's API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('provider, api_key')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_active', true);

    if (keysError) {
      throw new Error('Failed to fetch API keys');
    }

    if (!apiKeys || apiKeys.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No active API keys found',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Found ${apiKeys.length} active API keys`);

    const results: ProviderTestResult[] = [];

    // Test each provider
    for (const keyData of apiKeys) {
      console.log(`🧪 Testing ${keyData.provider} models...`);
      
      let testResult: ProviderTestResult;
      
      switch (keyData.provider) {
        case 'openai':
          testResult = await testOpenAIModels(keyData.api_key);
          break;
        case 'anthropic':
          testResult = await testAnthropicModels(keyData.api_key);
          break;
        case 'perplexity':
          testResult = await testPerplexityModels(keyData.api_key);
          break;
        default:
          testResult = {
            provider: keyData.provider,
            availableModels: [],
            unavailableModels: [],
            error: 'Provider not supported for model testing'
          };
      }

      results.push(testResult);

      // Store results in database
      const modelChecks: ModelAvailability[] = [];
      
      // Add available models
      for (const model of testResult.availableModels) {
        modelChecks.push({
          provider: keyData.provider,
          modelId: model,
          isAvailable: true,
          lastChecked: new Date().toISOString()
        });
      }

      // Add unavailable models
      for (const model of testResult.unavailableModels) {
        modelChecks.push({
          provider: keyData.provider,
          modelId: model,
          isAvailable: false,
          lastChecked: new Date().toISOString(),
          error: testResult.error
        });
      }

      // Update model availability table
      for (const check of modelChecks) {
        await supabase
          .from('model_availability')
          .upsert({
            provider: check.provider,
            model_id: check.modelId,
            is_available: check.isAvailable,
            last_checked: check.lastChecked,
            error_message: check.error,
            user_id: user.id
          }, {
            onConflict: 'provider,model_id,user_id'
          });
      }

      console.log(`✅ ${keyData.provider}: ${testResult.availableModels.length} available, ${testResult.unavailableModels.length} unavailable`);
    }

    // Check for deprecated models and send alerts
    const deprecatedModelsFound = results.flatMap(r => 
      r.unavailableModels.filter(model => 
        ['gpt-4', 'gpt-4-vision-preview', 'claude-3-opus-20240229'].includes(model)
      )
    );

    if (deprecatedModelsFound.length > 0) {
      console.warn(`⚠️ Deprecated models detected: ${deprecatedModelsFound.join(', ')}`);
      
      // Log deprecation warning
      await supabase
        .from('system_alerts')
        .insert({
          user_id: user.id,
          type: 'model_deprecation',
          severity: 'warning',
          title: 'Deprecated AI Models Detected',
          message: `The following models are no longer available: ${deprecatedModelsFound.join(', ')}. Please update your configurations to use current models.`,
          metadata: { deprecatedModels: deprecatedModelsFound }
        });
    }

    return new Response(JSON.stringify({
      message: 'Model availability check completed',
      results,
      summary: {
        totalProviders: results.length,
        totalModelsChecked: results.reduce((sum, r) => sum + r.availableModels.length + r.unavailableModels.length, 0),
        deprecatedModelsFound: deprecatedModelsFound.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Model availability check failed:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});