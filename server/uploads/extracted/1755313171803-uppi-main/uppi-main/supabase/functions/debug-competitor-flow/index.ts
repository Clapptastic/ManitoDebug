import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DebugResponse {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results: DebugResponse[] = [];
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'Unknown error'}`);
    }

    results.push({
      step: 'authentication',
      success: true,
      data: { userId: user.id },
      timestamp: new Date().toISOString()
    });

    // Step 1: Check API Keys
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('provider, status, is_active, masked_key')
      .eq('user_id', user.id)
      .eq('is_active', true);

    results.push({
      step: 'api_keys_check',
      success: !apiKeyError,
      data: {
        count: apiKeys?.length || 0,
        providers: apiKeys?.map(k => ({ provider: k.provider, status: k.status })) || [],
        error: apiKeyError?.message
      },
      error: apiKeyError?.message,
      timestamp: new Date().toISOString()
    });

    // Step 2: Test AI Provider (fetch actual API key)
    const openaiKey = apiKeys?.find(k => k.provider === 'openai');
    if (openaiKey) {
      try {
        // Get the actual API key value
        const { data: fullKeyData, error: keyError } = await supabase
          .from('api_keys')
          .select('api_key')
          .eq('id', openaiKey.id)
          .single();

        if (keyError || !fullKeyData?.api_key) {
          results.push({
            step: 'openai_test',
            success: false,
            error: 'Could not retrieve OpenAI API key',
            timestamp: new Date().toISOString()
          });
        } else {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${fullKeyData.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: 'Test message. Just return "success".' }],
              max_tokens: 10
            })
          });

          const openaiData = await openaiResponse.json();
          results.push({
            step: 'openai_test',
            success: openaiResponse.ok,
            data: {
              status: openaiResponse.status,
              hasContent: !!openaiData.choices?.[0]?.message?.content,
              content: openaiData.choices?.[0]?.message?.content
            },
            error: !openaiResponse.ok ? openaiData.error?.message : undefined,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        results.push({
          step: 'openai_test',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      results.push({
        step: 'openai_test',
        success: false,
        error: 'No OpenAI API key found',
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Test Database Write
    try {
      const testAnalysis = {
        user_id: user.id,
        name: 'Debug Test Analysis',
        description: 'Test analysis for debugging',
        status: 'completed',
        analysis_data: {
          results: [{
            name: 'Test Competitor',
            strengths: ['Test strength'],
            weaknesses: ['Test weakness'],
            opportunities: ['Test opportunity'],
            threats: ['Test threat'],
            data_quality_score: 85
          }]
        },
        strengths: ['Test strength'],
        weaknesses: ['Test weakness'],
        opportunities: ['Test opportunity'],
        threats: ['Test threat']
      };

      const { data: insertData, error: insertError } = await supabase
        .from('competitor_analyses')
        .insert([testAnalysis])
        .select('*')
        .single();

      results.push({
        step: 'database_write_test',
        success: !insertError,
        data: {
          inserted: !!insertData,
          id: insertData?.id,
          hasAnalysisData: !!insertData?.analysis_data,
          hasSwotData: !!(insertData?.strengths?.length > 0)
        },
        error: insertError?.message,
        timestamp: new Date().toISOString()
      });

      // Clean up test data
      if (insertData?.id) {
        await supabase
          .from('competitor_analyses')
          .delete()
          .eq('id', insertData.id);
      }
    } catch (error) {
      results.push({
        step: 'database_write_test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Test Database Read
    try {
      const { data: readData, error: readError } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      results.push({
        step: 'database_read_test',
        success: !readError,
        data: {
          found: readData?.length || 0,
          hasAnalysisData: !!(readData?.[0]?.analysis_data),
          hasSwotData: !!(readData?.[0]?.strengths?.length > 0),
          sample: readData?.[0] ? {
            id: readData[0].id,
            name: readData[0].name,
            strengthsCount: readData[0].strengths?.length || 0,
            weaknessesCount: readData[0].weaknesses?.length || 0,
            analysisDataType: typeof readData[0].analysis_data,
            hasResults: !!(readData[0].analysis_data?.results)
          } : null
        },
        error: readError?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      results.push({
        step: 'database_read_test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Test Edge Function Response Structure
    const testResults = [{
      name: 'Test Company',
      strengths: ['Innovation', 'Strong brand'],
      weaknesses: ['Limited reach', 'High costs'],
      opportunities: ['Market expansion', 'New tech'],
      threats: ['Competition', 'Regulation'],
      industry: 'Technology',
      founded_year: 2020,
      employee_count: 500,
      data_quality_score: 85,
      analysis_data: {
        provider: 'test',
        confidence_scores: { strengths: 1, weaknesses: 1 }
      }
    }];

    results.push({
      step: 'response_structure_test',
      success: true,
      data: {
        resultsLength: testResults.length,
        hasSwotData: testResults.every(r => r.strengths?.length > 0),
        dataTypes: {
          name: typeof testResults[0].name,
          strengths: Array.isArray(testResults[0].strengths),
          founded_year: typeof testResults[0].founded_year,
          employee_count: typeof testResults[0].employee_count
        },
        sample: testResults[0]
      },
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        debugResults: results,
        summary: {
          totalSteps: results.length,
          successfulSteps: results.filter(r => r.success).length,
          failedSteps: results.filter(r => !r.success).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Debug flow error:', error);
    results.push({
      step: 'global_error',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debugResults: results
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});