import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface AnalysisRequest {
  userId: string;
  query: string;
  queryType: 'natural_language' | 'ticker_search' | 'industry_analysis';
  ticker?: string;
  timeRange?: string;
  stockData?: any;
  newsData?: any[];
}

async function analyzeWithAI(data: any, query: string, queryType: string, userId: string, supabase: any, authHeader: string): Promise<any> {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  // Get trusted data sources and AI model performance
  const { data: trustedSources } = await supabase
    .from('trusted_data_sources')
    .select('*')
    .eq('is_active', true)
    .order('reliability_score', { ascending: false });

  const { data: aiPerformance } = await supabase
    .from('ai_model_performance')
    .select('*')
    .eq('model_name', 'gpt-4o-mini')
    .eq('task_type', 'market_analysis')
    .single();

  const currentAccuracy = aiPerformance?.accuracy_score || 85;
  const confidenceCalibration = aiPerformance?.confidence_calibration || 0.82;

  const systemPrompt = `You are an expert financial analyst with ${currentAccuracy}% historical accuracy on market analysis tasks. You must provide analysis with precise confidence scoring and source citations.

CRITICAL REQUIREMENTS:
1. All confidence scores must be between 0-100 and calibrated based on data quality
2. Always cite data sources with reliability scores
3. Cross-validate claims across multiple sources when possible
4. Flag any data inconsistencies or limitations
5. Adjust confidence based on data freshness and reliability

Your response MUST include:
- Overall confidence score (0-100)
- Source citations with individual confidence scores
- Data quality assessment
- Cross-validation notes
- Risk assessment with confidence levels
- Methodology explanation

Available trusted sources (use their reliability scores in your analysis):
${trustedSources?.map(s => `- ${s.source_name}: ${s.reliability_score}% reliable (${s.source_type})`).join('\n') || 'No trusted sources configured'}

Historical model performance: ${currentAccuracy}% accuracy, ${Math.round(confidenceCalibration * 100)}% confidence calibration.

Data format includes stock prices, volume, news, technical indicators, and market size data.`;

  const userPrompt = `User Query: "${query}"
Query Type: ${queryType}

Market Data: ${JSON.stringify(data, null, 2)}

Please provide:
1. Direct answer to the user's question
2. Key insights from the data
3. Risk factors to consider
4. Opportunities identified
5. Confidence level (0-100)
6. Specific recommendations
7. Source citations with confidence scores
8. Data quality assessment

Format your response as JSON with these enhanced fields including trust mechanisms:
{
  "answer": "Direct response to user query",
  "insights": ["insight1", "insight2", "insight3"],
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "confidenceScore": 85,
  "recommendations": ["rec1", "rec2"],
  "summary": "Brief executive summary",
  "confidenceScores": {
    "overall": 85,
    "data_quality": 78,
    "methodology": 90,
    "source_reliability": 82
  },
  "sourceCitations": [
    {
      "field": "market_size",
      "source": "Specific Source Name (e.g., Gartner Market Report 2024)",
      "url": "https://direct-link-to-source.com/report",
      "confidence": 95,
      "data_point": "specific information cited",
      "verification_date": "2024-01-15"
    }
  ],
  "dataQualityScore": 82,
  "validationNotes": "Analysis based on X sources with Y% average reliability",
  "aiModelsUsed": ["gpt-4o-mini"],
  "sourcesChecked": 3,
  "consistencyScore": 0.87,
  "methodology": "Multi-source cross-validation with confidence weighting"
}`;

  try {
    const { data: chatData, error: chatError } = await supabase.functions.invoke('secure-openai-chat', {
      body: {
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      headers: { Authorization: authHeader }
    });

    if (chatError) {
      throw new Error(chatError.message || 'Model invocation failed');
    }

    const content = chatData?.choices?.[0]?.message?.content || chatData?.generatedText;
    if (!content) {
      throw new Error('No content in model response');
    }

    // Try to parse as JSON, fallback to text response
    try {
      return JSON.parse(content);
    } catch {
      return {
        answer: content,
        insights: [],
        riskFactors: [],
        opportunities: [],
        confidenceScore: 0.5,
        recommendations: [],
        summary: content.substring(0, 200) + '...'
      };
    }
  } catch (error) {
    console.error('AI invoke error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const { searchParams } = new URL(req.url);
  if (req.method === 'GET' && (searchParams.get('health') === '1' || searchParams.get('health') === 'true')) {
    return new Response(
      JSON.stringify({ success: true, message: 'ok' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user and propagate identity to downstream calls
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const requestData: AnalysisRequest = await req.json();
    
    const { userId, query, queryType, ticker, timeRange = '1m', stockData, newsData } = requestData;

    if (!userId || !query) {
      return new Response(
        JSON.stringify({ error: 'User ID and query are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing analysis for user ${userId}: ${query}`);

    // Store the analysis session in database
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('market_analysis_sessions')
      .insert({
        user_id: userId,
        query_text: query,
        session_type: queryType === 'ticker_search' ? 'ticker_search' : 
                     queryType === 'industry_analysis' ? 'market_segment' : 'company_analysis',
        ticker_symbol: ticker,
        time_range: timeRange,
        validation_status: 'processing',
        ai_models_used: ['gpt-4o-mini'],
        sources_checked: 0
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to store analysis session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    try {
      // Prepare data for AI analysis
      const analysisData = {
        ticker,
        timeRange,
        stockData: stockData || {},
        newsData: newsData || [],
        technicalIndicators: stockData?.technicalIndicators || {},
        query,
        queryType
      };

      // Get AI analysis with trust mechanisms
      const aiAnalysis = await analyzeWithAI(analysisData, query, queryType, userId, supabase, authHeader);
      const processingTime = Date.now() - startTime;

      // Update session with results including trust metrics
      const { error: updateError } = await supabase
        .from('market_analysis_sessions')
        .update({
          analysis_result: aiAnalysis,
          confidence_scores: aiAnalysis.confidenceScores || {},
          source_citations: aiAnalysis.sourceCitations || [],
          data_quality_score: aiAnalysis.dataQualityScore || 0,
          sentiment_score: aiAnalysis.sentimentScore || null,
          processing_time_ms: processingTime,
          validation_status: 'completed',
          sources_checked: aiAnalysis.sourcesChecked || 1,
          consistency_score: aiAnalysis.consistencyScore || 0.0,
          ai_models_used: aiAnalysis.aiModelsUsed || ['gpt-4o-mini']
        })
        .eq('id', sessionRecord.id);

      if (updateError) {
        console.error('Query update error:', updateError);
      }

      const response = {
        sessionId: sessionRecord.id,
        analysis: aiAnalysis,
        processingTimeMs: processingTime,
        sentimentScore: aiAnalysis.sentimentScore || null,
        timestamp: new Date().toISOString()
      };

      console.log(`Analysis completed in ${processingTime}ms`);

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      
      // Update session status to failed
      await supabase
        .from('market_analysis_sessions')
        .update({
          validation_status: 'failed',
          analysis_result: { error: analysisError.message }
        })
        .eq('id', sessionRecord.id);

      return new Response(
        JSON.stringify({ error: 'Analysis failed', details: analysisError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('AI Market Analyst error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});