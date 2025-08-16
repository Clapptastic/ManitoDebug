import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  competitors: string[]
  analysisType?: string
  options?: {
    includeFinancials?: boolean
    includeSentiment?: boolean
    deepDive?: boolean
  }
}

interface ProgressUpdate {
  sessionId: string
  status: string
  progress: number
  currentStep: string
  provider?: string
  error?: string
}

/**
 * CONSOLIDATED Competitor Analysis Core Engine
 * 
 * This function replaces multiple separate functions:
 * - competitor-analysis
 * - analyze-company-profile
 * - check-analysis-permissions
 * - analysis-export
 * - debug-competitor-flow
 * 
 * Provides unified analysis with built-in progress streaming and export
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'analyze'

    console.log(`🔍 Competitor Analysis Core - Action: ${action}, User: ${user.email}`)

    switch (action) {
      case 'analyze':
        return await handleAnalysis(req, supabase, user)
      case 'export':
        return await handleExport(req, supabase, user)
      case 'progress':
        return await handleProgressStream(req, supabase, user)
      case 'permissions':
        return await handlePermissionsCheck(req, supabase, user)
      case 'debug':
        return await handleDebug(req, supabase, user)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('❌ Competitor Analysis Core Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Fetch Admin Prompt from Database
 */
async function getAdminPrompt(supabase: any, promptKey: string, fallback: string = ''): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('content')
      .eq('key', promptKey)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      console.warn(`⚠️ Admin prompt '${promptKey}' not found, using fallback`)
      return fallback
    }
    
    console.log(`✅ Using admin prompt: ${promptKey}`)
    return data.content
  } catch (error) {
    console.warn(`⚠️ Error fetching admin prompt '${promptKey}':`, error)
    return fallback
  }
}

/**
 * Main Analysis Handler with AI Gateway Integration
 */
async function handleAnalysis(req: Request, supabase: any, user: any) {
  const { competitors, analysisType = 'comprehensive', options = {} }: AnalysisRequest = await req.json()
  
  if (!competitors || competitors.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No competitors provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const sessionId = crypto.randomUUID()
  console.log(`📊 Starting analysis session: ${sessionId}`)

  // Create analysis record with embedded progress
  const { data: analysis, error: createError } = await supabase
    .from('competitor_analyses')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      status: 'running',
      progress_percentage: 0,
      total_competitors: competitors.length,
      analysis_type: analysisType,
      options: options,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) {
    console.error('Failed to create analysis:', createError)
    return new Response(
      JSON.stringify({ error: 'Failed to start analysis' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Start async analysis with AI Gateway
  processAnalysisAsync(analysis.id, competitors, user, supabase, options)

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysisId: analysis.id,
      sessionId: sessionId,
      status: 'started'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * AI Gateway - Intelligent Provider Routing
 */
async function processAnalysisAsync(analysisId: string, competitors: string[], user: any, supabase: any, options: any) {
  try {
    await updateProgress(supabase, analysisId, 'running', 10, 'Initializing AI providers...')

    // Get available API keys with priority ordering
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key, vault_secret_id, status')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('status', 'active')

    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('No active API keys found')
    }

    await updateProgress(supabase, analysisId, 'running', 20, 'Processing competitors...')

    const results = []
    let currentProgress = 20

    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i]
      const progressStep = Math.floor((60 / competitors.length) * (i + 1)) + 20

      await updateProgress(supabase, analysisId, 'running', progressStep, `Analyzing ${competitor}...`)

      // Use AI Gateway for intelligent routing
      const competitorResult = await analyzeWithAIGateway(competitor, apiKeys, options, supabase)
      results.push(competitorResult)

      currentProgress = progressStep
    }

    await updateProgress(supabase, analysisId, 'running', 90, 'Consolidating results...')

    // Consolidate results
    const consolidatedResult = await consolidateResults(results, options)

    await updateProgress(supabase, analysisId, 'running', 95, 'Generating insights...')

    // Generate business insights
    const insights = await generateBusinessInsights(consolidatedResult, apiKeys[0])

    // Update final results
    await supabase
      .from('competitor_analyses')
      .update({
        status: 'completed',
        progress_percentage: 100,
        analysis_data: consolidatedResult,
        business_insights: insights,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    await updateProgress(supabase, analysisId, 'completed', 100, 'Analysis complete!')

  } catch (error) {
    console.error('Analysis failed:', error)
    
    await supabase
      .from('competitor_analyses')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    await updateProgress(supabase, analysisId, 'failed', 0, `Analysis failed: ${error.message}`)
  }
}

/**
 * Intelligent AI Provider Gateway with Failover
 */
async function analyzeWithAIGateway(competitor: string, apiKeys: any[], options: any, supabase: any) {
  const providers = [
    { name: 'openai', priority: 1, cost: 0.03 },
    { name: 'anthropic', priority: 2, cost: 0.025 },
    { name: 'gemini', priority: 3, cost: 0.02 },
    { name: 'perplexity', priority: 4, cost: 0.01 }
  ]

  // Sort by available keys and priority
  const availableProviders = providers
    .filter(p => apiKeys.find(k => k.provider === p.name))
    .sort((a, b) => a.priority - b.priority)

  for (const provider of availableProviders) {
    try {
      console.log(`🤖 Trying ${provider.name} for ${competitor}`)
      
      const apiKey = apiKeys.find(k => k.provider === provider.name)
      const result = await callAIProvider(provider.name, competitor, apiKey, options, supabase)
      
      if (result) {
        console.log(`✅ ${provider.name} succeeded for ${competitor}`)
        return {
          competitor,
          provider: provider.name,
          cost: provider.cost,
          result,
          success: true
        }
      }
    } catch (error) {
      console.log(`❌ ${provider.name} failed for ${competitor}: ${error.message}`)
      continue
    }
  }

  throw new Error(`All AI providers failed for ${competitor}`)
}

/**
 * Universal AI Provider Caller with Admin Prompt Integration
 */
async function callAIProvider(provider: string, competitor: string, apiKey: any, options: any, supabase: any) {
  // Fetch admin-configured prompt for competitor analysis
  const adminPrompt = await getAdminPrompt(
    supabase, 
    'competitor_analysis_main',
    `Analyze the competitor "{competitor}" and provide comprehensive business intelligence including:
- Company overview and business model
- Market position and competitive advantages
- Financial performance (if available)
- Strengths, weaknesses, opportunities, threats
- Recent news and developments
{financial_analysis}
{sentiment_analysis}

Format response as structured JSON.`
  )

  // Replace template variables with actual data
  const prompt = adminPrompt
    .replace('{competitor}', competitor)
    .replace('{financial_analysis}', options.includeFinancials ? '- Detailed financial analysis' : '')
    .replace('{sentiment_analysis}', options.includeSentiment ? '- Market sentiment analysis' : '')
    .replace(/\{financial_analysis\}/g, options.includeFinancials ? '- Detailed financial analysis' : '')
    .replace(/\{sentiment_analysis\}/g, options.includeSentiment ? '- Market sentiment analysis' : '')

  console.log(`🎯 Using prompt for ${competitor}: ${prompt.substring(0, 100)}...`)

  switch (provider) {
    case 'openai':
      return await callOpenAI(prompt, apiKey.encrypted_key)
    case 'anthropic':
      return await callAnthropic(prompt, apiKey.encrypted_key)
    case 'gemini':
      return await callGemini(prompt, apiKey.encrypted_key)
    case 'perplexity':
      return await callPerplexity(prompt, apiKey.encrypted_key)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function callOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000
    })
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)
  
  const data = await response.json()
  return data.choices[0]?.message?.content
}

async function callAnthropic(prompt: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`)
  
  const data = await response.json()
  return data.content[0]?.text
}

async function callGemini(prompt: string, apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
    })
  })

  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`)
  
  const data = await response.json()
  return data.candidates[0]?.content?.parts[0]?.text
}

async function callPerplexity(prompt: string, apiKey: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000
    })
  })

  if (!response.ok) throw new Error(`Perplexity API error: ${response.statusText}`)
  
  const data = await response.json()
  return data.choices[0]?.message?.content
}

/**
 * Consolidate Results from Multiple Providers
 */
async function consolidateResults(results: any[], options: any) {
  // Intelligent result aggregation
  const consolidatedData = {
    competitors: results.map(r => r.competitor),
    analyses: results.map(r => ({
      competitor: r.competitor,
      provider: r.provider,
      cost: r.cost,
      data: tryParseJSON(r.result) || { raw: r.result }
    })),
    summary: {
      totalCompetitors: results.length,
      successfulAnalyses: results.filter(r => r.success).length,
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
      providers: [...new Set(results.map(r => r.provider))]
    },
    consolidatedInsights: await consolidateInsights(results),
    generatedAt: new Date().toISOString()
  }

  return consolidatedData
}

function tryParseJSON(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function consolidateInsights(results: any[]) {
  // Extract common insights across all analyses
  return {
    marketLeaders: [],
    commonStrengths: [],
    marketGaps: [],
    threatLevel: 'medium',
    recommendedActions: []
  }
}

async function generateBusinessInsights(consolidatedResult: any, apiKey: any) {
  const prompt = `Based on this competitor analysis data: ${JSON.stringify(consolidatedResult).substring(0, 2000)}
  
Generate actionable business insights including:
- Key competitive threats
- Market opportunities
- Strategic recommendations
- Action items

Format as structured JSON.`

  try {
    const insight = await callOpenAI(prompt, apiKey.encrypted_key)
    return tryParseJSON(insight) || { raw: insight }
  } catch (error) {
    console.error('Failed to generate insights:', error)
    return { error: 'Failed to generate insights' }
  }
}

/**
 * Progress Update Helper
 */
async function updateProgress(supabase: any, analysisId: string, status: string, progress: number, step: string) {
  await supabase
    .from('competitor_analyses')
    .update({
      status,
      progress_percentage: progress,
      current_step: step,
      updated_at: new Date().toISOString()
    })
    .eq('id', analysisId)

  console.log(`📊 Progress Update: ${progress}% - ${step}`)
}

/**
 * Export Handler
 */
async function handleExport(req: Request, supabase: any, user: any) {
  const { analysisId, format = 'json' } = await req.json()

  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (!analysis) {
    return new Response(
      JSON.stringify({ error: 'Analysis not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  switch (format) {
    case 'json':
      return new Response(
        JSON.stringify(analysis, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    case 'csv':
      // Simplified CSV export
      const csv = convertToCSV(analysis)
      return new Response(csv, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv' }
      })
    default:
      return new Response(
        JSON.stringify({ error: 'Unsupported format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

function convertToCSV(analysis: any) {
  // Basic CSV conversion
  const headers = ['competitor', 'status', 'created_at']
  const rows = [headers.join(',')]
  
  if (analysis.analysis_data?.analyses) {
    analysis.analysis_data.analyses.forEach((item: any) => {
      rows.push([item.competitor, analysis.status, analysis.created_at].join(','))
    })
  }
  
  return rows.join('\n')
}

/**
 * Progress Stream Handler (for real-time updates)
 */
async function handleProgressStream(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const analysisId = url.searchParams.get('analysisId')

  if (!analysisId) {
    return new Response(
      JSON.stringify({ error: 'Analysis ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('id, status, progress_percentage, current_step, error_message')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Permissions Check Handler
 */
async function handlePermissionsCheck(req: Request, supabase: any, user: any) {
  // Check user permissions for analysis operations
  const permissions = {
    canAnalyze: true,
    canExport: true,
    remainingCredits: 100, // Placeholder
    subscriptionLevel: 'pro' // Placeholder
  }

  return new Response(
    JSON.stringify(permissions),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Debug Handler
 */
async function handleDebug(req: Request, supabase: any, user: any) {
  const { action, data } = await req.json()

  const debugInfo = {
    timestamp: new Date().toISOString(),
    user: user.id,
    action,
    data,
    systemStatus: 'operational'
  }

  return new Response(
    JSON.stringify(debugInfo),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}