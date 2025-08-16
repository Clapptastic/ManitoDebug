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
    const { analysisType } = await req.json();
    
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

    // Get user's OpenAI API key
    const { data: apiKeysResponse, error: keyError } = await supabase.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: user.id,
      provider_param: 'openai'
    });
    
    if (keyError || !apiKeysResponse?.api_key) {
      throw new Error('OpenAI API key not found. Please add your OpenAI API key in Settings.');
    }

    // Fetch real analytics data from database
    const analyticsData = await fetchRealAnalyticsData(supabase, user.id);
    
    // Generate AI insights using OpenAI
    const insights = await generateAIInsights(analyticsData, apiKeysResponse.api_key);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...analyticsData,
          ai_insights: insights,
          generated_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI analytics:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchRealAnalyticsData(supabase: any, userId: string) {
  try {
    // Fetch real user metrics
    const { data: userMetrics } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('user_id', userId);

    // Fetch competitor analyses metrics
    const { data: competitorAnalyses } = await supabase
      .from('competitor_analyses')
      .select('id, created_at, status, actual_cost')
      .eq('user_id', userId);

    // Fetch API usage metrics
    const { data: apiUsage } = await supabase
      .from('api_usage_tracking')
      .select('provider, tokens_used, cost_usd, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    // Calculate real metrics
    const totalAnalyses = competitorAnalyses?.length || 0;
    const completedAnalyses = competitorAnalyses?.filter(a => a.status === 'completed').length || 0;
    const totalCost = competitorAnalyses?.reduce((sum, a) => sum + (a.actual_cost || 0), 0) || 0;
    const totalTokens = apiUsage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0;
    const totalApiCost = apiUsage?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;

    return {
      userMetrics: {
        totalUsers: userMetrics?.length || 1,
        activeUsers: userMetrics?.filter(u => 
          new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 1,
        newUsers: userMetrics?.filter(u => 
          new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length || 1,
        churnRate: 0
      },
      analysisMetrics: {
        totalAnalyses,
        completedAnalyses,
        successRate: totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0,
        totalCost,
        averageCostPerAnalysis: totalAnalyses > 0 ? totalCost / totalAnalyses : 0
      },
      apiMetrics: {
        totalTokens,
        totalCost: totalApiCost,
        averageTokensPerRequest: apiUsage?.length > 0 ? totalTokens / apiUsage.length : 0
      },
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw new Error('Failed to fetch analytics data');
  }
}

async function generateAIInsights(data: any, apiKey: string): Promise<string> {
  try {
    const prompt = `Analyze this user's analytics data and provide actionable insights:

User Metrics:
- Total Users: ${data.userMetrics.totalUsers}
- Active Users: ${data.userMetrics.activeUsers}
- New Users: ${data.userMetrics.newUsers}

Analysis Metrics:
- Total Analyses: ${data.analysisMetrics.totalAnalyses}
- Completed Analyses: ${data.analysisMetrics.completedAnalyses}
- Success Rate: ${data.analysisMetrics.successRate.toFixed(1)}%
- Total Cost: $${data.analysisMetrics.totalCost.toFixed(2)}
- Average Cost per Analysis: $${data.analysisMetrics.averageCostPerAnalysis.toFixed(2)}

API Usage:
- Total Tokens: ${data.apiMetrics.totalTokens}
- Total API Cost: $${data.apiMetrics.totalCost.toFixed(2)}
- Average Tokens per Request: ${data.apiMetrics.averageTokensPerRequest.toFixed(0)}

Please provide:
1. Key performance insights
2. Cost optimization recommendations
3. Usage pattern analysis
4. Actionable recommendations for improvement

Keep the response concise and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst specializing in SaaS analytics and cost optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI insights');
    }

    const result = await response.json();
    return result.choices[0].message.content;

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return 'Unable to generate AI insights at this time. Please check your OpenAI API key and try again.';
  }
}