import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileSetupRequest {
  websiteUrl: string
  companyName?: string
  industry?: string
  userId: string
}

interface StreamUpdate {
  step: string
  status: 'starting' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
  data?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, companyName, industry, userId }: ProfileSetupRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get API keys for the user
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('provider, api_key, status')
      .eq('user_id', userId)
      .eq('is_active', true)

    const openaiKey = apiKeys?.find(k => k.provider === 'openai')?.api_key
    const anthropicKey = apiKeys?.find(k => k.provider === 'anthropic')?.api_key

    // Create a ReadableStream for server-sent events
    const stream = new ReadableStream({
      start(controller) {
        const sendUpdate = (update: StreamUpdate) => {
          const data = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        }

        const processProfile = async () => {
          try {
            // Step 1: Website Scraping
            sendUpdate({
              step: 'website_scraping',
              status: 'starting',
              message: 'Starting website analysis...',
              progress: 10
            })

            const websiteData = await scrapeWebsite(websiteUrl)
            
            sendUpdate({
              step: 'website_scraping',
              status: 'completed',
              message: 'Website data extracted successfully',
              progress: 25,
              data: { extractedInfo: websiteData.summary }
            })

            // Step 2: AI Analysis with OpenAI
            if (openaiKey) {
              sendUpdate({
                step: 'openai_analysis',
                status: 'starting',
                message: 'Analyzing company with OpenAI...',
                progress: 30
              })

              const openaiAnalysis = await analyzeWithOpenAI(
                websiteData.content, 
                companyName || websiteData.companyName,
                openaiKey
              )

              sendUpdate({
                step: 'openai_analysis',
                status: 'completed',
                message: 'OpenAI analysis completed',
                progress: 50,
                data: openaiAnalysis
              })
            }

            // Step 3: AI Analysis with Anthropic
            if (anthropicKey) {
              sendUpdate({
                step: 'anthropic_analysis',
                status: 'starting',
                message: 'Getting insights from Anthropic Claude...',
                progress: 55
              })

              const anthropicAnalysis = await analyzeWithAnthropic(
                websiteData.content,
                companyName || websiteData.companyName,
                anthropicKey
              )

              sendUpdate({
                step: 'anthropic_analysis',
                status: 'completed',
                message: 'Anthropic analysis completed',
                progress: 75,
                data: anthropicAnalysis
              })
            }

            // Step 4: Data Consolidation
            sendUpdate({
              step: 'data_consolidation',
              status: 'starting',
              message: 'Consolidating and structuring data...',
              progress: 80
            })

            const consolidatedProfile = await consolidateProfileData({
              websiteData,
              openaiAnalysis: openaiKey ? await analyzeWithOpenAI(websiteData.content, companyName || websiteData.companyName, openaiKey) : null,
              anthropicAnalysis: anthropicKey ? await analyzeWithAnthropic(websiteData.content, companyName || websiteData.companyName, anthropicKey) : null,
              userInput: { companyName, industry }
            })

            // Step 5: Save to Database
            sendUpdate({
              step: 'database_save',
              status: 'starting',
              message: 'Saving profile to database...',
              progress: 90
            })

            const { data: savedProfile, error } = await supabase
              .from('company_profiles')
              .upsert({
                user_id: userId,
                ...consolidatedProfile,
                ai_analysis_data: {
                  website_scraped_at: new Date().toISOString(),
                  sources_used: ['website_scraping', ...(openaiKey ? ['openai'] : []), ...(anthropicKey ? ['anthropic'] : [])],
                  confidence_score: consolidatedProfile.profile_completeness_score || 85
                }
              })
              .select()
              .single()

            if (error) throw error

            sendUpdate({
              step: 'completed',
              status: 'completed',
              message: 'AI-powered profile setup completed successfully!',
              progress: 100,
              data: { profile: savedProfile }
            })

          } catch (error) {
            console.error('Profile setup error:', error)
            sendUpdate({
              step: 'error',
              status: 'error',
              message: `Setup failed: ${error.message}`,
              progress: 0
            })
          } finally {
            controller.close()
          }
        }

        processProfile()
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function scrapeWebsite(url: string) {
  try {
    console.log('Scraping website:', url)
    
    // Simple fetch-based scraping (you could integrate with Firecrawl or similar service)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract basic information using regex (simplified approach)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
    
    // Extract text content (simplified)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000) // Limit to first 5000 chars
    
    return {
      companyName: titleMatch?.[1]?.split('|')[0]?.split('-')[0]?.trim() || '',
      title: titleMatch?.[1] || '',
      description: descriptionMatch?.[1] || '',
      keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()) || [],
      content: textContent,
      url: url,
      summary: `Extracted ${textContent.length} characters of content from ${url}`
    }
  } catch (error) {
    console.error('Website scraping error:', error)
    throw new Error(`Failed to scrape website: ${error.message}`)
  }
}

async function analyzeWithOpenAI(content: string, companyName: string, apiKey: string) {
  try {
    console.log('Analyzing with OpenAI for company:', companyName)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a business analyst expert. Analyze the provided company information and return a structured JSON response with the following fields:
            - industry: string
            - business_model: string  
            - value_proposition: string
            - target_market: array of strings
            - key_products: array of strings
            - competitive_advantages: array of strings
            - company_culture: string
            - funding_stage: string (if identifiable)
            - employee_count_estimate: number (if estimable)
            - revenue_estimate: number (if estimable)
            - headquarters: string (if identifiable)
            - founded_year: number (if identifiable)
            
            Return only valid JSON without markdown formatting.`
          },
          {
            role: 'user',
            content: `Analyze this company: ${companyName}\n\nWebsite content: ${content.substring(0, 3000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content

    try {
      return JSON.parse(analysisText)
    } catch {
      // If JSON parsing fails, return structured data
      return {
        industry: 'Technology',
        business_model: 'Analysis pending',
        analysis_summary: analysisText
      }
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    throw new Error(`OpenAI analysis failed: ${error.message}`)
  }
}

async function analyzeWithAnthropic(content: string, companyName: string, apiKey: string) {
  try {
    console.log('Analyzing with Anthropic for company:', companyName)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Analyze this company website content for ${companyName}. Provide insights about:
            1. Market position and strategy
            2. Innovation and technology focus
            3. Growth potential and challenges
            4. Competitive landscape position
            5. Key differentiators
            
            Website content: ${content.substring(0, 3000)}
            
            Respond in JSON format with keys: market_position, innovation_focus, growth_potential, competitive_position, key_differentiators`
          }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.content[0].text

    try {
      return JSON.parse(analysisText)
    } catch {
      return {
        market_position: 'Analysis pending',
        analysis_summary: analysisText
      }
    }
  } catch (error) {
    console.error('Anthropic analysis error:', error)
    throw new Error(`Anthropic analysis failed: ${error.message}`)
  }
}

async function consolidateProfileData({ websiteData, openaiAnalysis, anthropicAnalysis, userInput }: any) {
  // Consolidate all gathered data into a company profile structure
  const profile = {
    company_name: userInput.companyName || websiteData.companyName || 'Unknown Company',
    website_url: websiteData.url,
    description: websiteData.description || openaiAnalysis?.value_proposition || 'Company description not available',
    industry: userInput.industry || openaiAnalysis?.industry || 'Technology',
    business_model: openaiAnalysis?.business_model || 'Not specified',
    value_proposition: openaiAnalysis?.value_proposition || '',
    target_market: openaiAnalysis?.target_market || [],
    key_products: openaiAnalysis?.key_products || [],
    competitive_advantages: openaiAnalysis?.competitive_advantages || [],
    company_culture: openaiAnalysis?.company_culture || '',
    funding_stage: openaiAnalysis?.funding_stage || '',
    employee_count: openaiAnalysis?.employee_count_estimate || null,
    revenue_estimate: openaiAnalysis?.revenue_estimate || null,
    headquarters: openaiAnalysis?.headquarters || '',
    founded_year: openaiAnalysis?.founded_year || null,
    market_position: anthropicAnalysis?.market_position || '',
    technology_stack: {
      innovation_focus: anthropicAnalysis?.innovation_focus || '',
      competitive_position: anthropicAnalysis?.competitive_position || ''
    },
    growth_metrics: {
      growth_potential: anthropicAnalysis?.growth_potential || '',
      key_differentiators: anthropicAnalysis?.key_differentiators || []
    },
    ai_analysis_data: {
      website_keywords: websiteData.keywords || [],
      confidence_scores: {
        openai_confidence: openaiAnalysis ? 85 : 0,
        anthropic_confidence: anthropicAnalysis ? 85 : 0,
        website_data_confidence: 90
      }
    },
    profile_completeness_score: calculateCompleteness({
      ...openaiAnalysis,
      ...anthropicAnalysis,
      website_url: websiteData.url
    })
  }

  return profile
}

function calculateCompleteness(data: any): number {
  const fields = [
    'company_name', 'website_url', 'description', 'industry', 'business_model',
    'value_proposition', 'target_market', 'key_products', 'competitive_advantages'
  ]
  
  let filledFields = 0
  fields.forEach(field => {
    if (data[field] && data[field] !== '' && 
        (!Array.isArray(data[field]) || data[field].length > 0)) {
      filledFields++
    }
  })
  
  return Math.round((filledFields / fields.length) * 100)
}