import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getStartupContext(supabase: any, userId: string) {
  try {
    // Helper utilities for context engineering
    const sanitize = (v: unknown) =>
      typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v;
    const truncate = (v: string | undefined, max = 280) =>
      (v || '').slice(0, max);
    const arr = (v: unknown): string[] => Array.isArray(v) ? v.filter(Boolean).map(String) : [];
    const topN = (list: string[], n = 5) => list.slice(0, n);

    // Prefer the consolidated RPC that already enforces user scoping and ordering
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_competitor_analyses', { user_id_param: userId });

    let competitorsRaw = rpcData || [];

    // Fallback to legacy table/columns (backward compatibility)
    if (rpcError || !competitorsRaw?.length) {
      const { data } = await supabase
        .from('competitor_analyses')
        .select(`
          id,
          user_id,
          name,
          competitor_name,
          description,
          company_overview,
          website_url,
          industry,
          status,
          strengths,
          weaknesses,
          opportunities,
          threats,
          market_position,
          target_market,
          pricing_strategy,
          analysis_data,
          confidence_scores,
          data_quality_score,
          created_at,
          updated_at,
          completed_at
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(8);
      competitorsRaw = data || [];
    }

    // Normalize competitors to a compact, model-friendly structure
    const normalized = (competitorsRaw as any[]).slice(0, 8).map((c) => {
      const name = c.name || c.competitor_name;
      const desc = c.description || c.company_overview || '';
      const mp = c.market_position;
      const strengths = arr(c.strengths);
      const weaknesses = arr(c.weaknesses);
      const opportunities = arr(c.opportunities);
      const threats = arr(c.threats);
      const confOverall = (c.confidence_scores && (c.confidence_scores.overall ?? c.confidence_scores.confidence)) ?? null;
      // Attempt to surface sources if present in analysis_data
      const sourceCount = (() => {
        const ad = c.analysis_data || {};
        const sources = ad.source_citations || ad.sources || [];
        return Array.isArray(sources) ? sources.length : 0;
      })();

      return {
        id: c.id,
        name: sanitize(name),
        website_url: c.website_url || null,
        industry: c.industry || null,
        position: typeof mp === 'string' ? mp : (mp?.market_position || mp?.position || null),
        target_market: topN(arr(c.target_market), 5),
        strengths: topN(strengths, 6),
        weaknesses: topN(weaknesses, 6),
        opportunities: topN(opportunities, 4),
        threats: topN(threats, 4),
        pricing_strategy: c.pricing_strategy || null,
        data_quality_score: typeof c.data_quality_score === 'number' ? c.data_quality_score : null,
        confidence_overall: typeof confOverall === 'number' ? confOverall : null,
        analyzed_at: c.completed_at || c.updated_at || c.created_at || null,
        summary: truncate(sanitize(desc), 360),
        sources_count: sourceCount
      };
    });

    // Aggregate quick insights
    const agg = normalized.reduce(
      (acc: any, n: any) => {
        if (typeof n.data_quality_score === 'number') {
          acc.qualitySum += n.data_quality_score; acc.countQ += 1;
        }
        if (typeof n.confidence_overall === 'number') {
          acc.confSum += n.confidence_overall; acc.countC += 1;
        }
        if (n.position) acc.positions[n.position] = (acc.positions[n.position] || 0) + 1;
        n.strengths?.forEach((s: string) => acc.strengths[s] = (acc.strengths[s] || 0) + 1);
        n.weaknesses?.forEach((w: string) => acc.weaknesses[w] = (acc.weaknesses[w] || 0) + 1);
        return acc;
      },
      { qualitySum: 0, confSum: 0, countQ: 0, countC: 0, positions: {} as Record<string, number>, strengths: {} as Record<string, number>, weaknesses: {} as Record<string, number> }
    );

    const sortEntries = (obj: Record<string, number>) => Object.entries(obj).sort((a,b) => b[1]-a[1]).map(([k]) => k);
    const avgQuality = agg.countQ ? +(agg.qualitySum / agg.countQ).toFixed(2) : null;
    const avgConfidence = agg.countC ? +(agg.confSum / agg.countC).toFixed(2) : null;

    const competitorContext = {
      items: normalized,
      summaryText: [
        `Count: ${normalized.length}`,
        avgQuality !== null ? `Avg Data Quality: ${avgQuality}` : null,
        avgConfidence !== null ? `Avg Confidence: ${avgConfidence}` : null,
        Object.keys(agg.positions).length ? `Positions: ${sortEntries(agg.positions).slice(0,4).join(', ')}` : null,
        Object.keys(agg.strengths).length ? `Common strengths: ${sortEntries(agg.strengths).slice(0,5).join(', ')}` : null,
        Object.keys(agg.weaknesses).length ? `Common weaknesses: ${sortEntries(agg.weaknesses).slice(0,5).join(', ')}` : null,
      ].filter(Boolean).join(' | ')
    };

    // Get market research
    const { data: research } = await supabase
      .from('market_research')
      .select('research_type, data, title, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get market size calculations
    const { data: marketSize } = await supabase
      .from('market_size_calculations')
      .select('tam, sam, som, industry, region, notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Get user's startup info
    const { data: startups } = await supabase
      .from('startups')
      .select('name, description, industry, stage')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get chat insights
    const { data: insights } = await supabase
      .from('chat_insights')
      .select('insight, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get MVP projects
    const { data: mvpProjects } = await supabase
      .from('mvp_projects')
      .select('title, description, features, moscow_priorities')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      competitors: normalized, // keep name for backward-compat
      competitorContext,
      research: research || [],
      insights: insights || [],
      marketSize: marketSize?.[0] || null,
      startups: startups || [],
      mvpProjects: mvpProjects || []
    };
  } catch (error) {
    console.error('Error fetching startup context:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the user's OpenAI API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('key_type', 'openai')
      .single();

    if (apiKeyError || !apiKeyData?.api_key) {
      console.error('Error fetching OpenAI API key:', apiKeyError);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not found. Please add your API key in Settings.',
          code: 'API_KEY_MISSING'
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch user's startup context
    const context = await getStartupContext(supabase, userId);
    
    // First, save the user's message
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        content: message,
        user_id: userId,
        is_bot: false,
        created_at: new Date().toISOString()
      });

    if (userMessageError) throw userMessageError;

    // Build system prompt with context
    let systemPrompt = `You are a helpful co-founder AI assistant that helps entrepreneurs with their business ideas and challenges. 
Your responses should be constructive, actionable, and based on best practices in entrepreneurship.
Keep responses concise and focused on practical next steps.
When discussing technical solutions, provide specific recommendations and best practices.
If the user mentions competitors, incorporate competitive analysis into your response.
For financial questions, focus on practical, actionable advice and common pitfalls to avoid.\n\n`;

    if (context) {
      // Add startup context if available
      if (context.startups?.length > 0) {
        const startup = context.startups[0];
        systemPrompt += `Current Startup Context:\n`;
        systemPrompt += `- Industry: ${startup.industry}\n`;
        systemPrompt += `- Stage: ${startup.stage}\n`;
        systemPrompt += `- Description: ${startup.description}\n\n`;
      }

      // Add market size data if available
      if (context.marketSize) {
        systemPrompt += `Market Size Analysis:\n`;
        systemPrompt += `- TAM: $${context.marketSize.tam}\n`;
        systemPrompt += `- SAM: $${context.marketSize.sam}\n`;
        systemPrompt += `- SOM: $${context.marketSize.som}\n`;
        systemPrompt += `- Region: ${context.marketSize.region}\n\n`;
      }

      // Add competitor analysis (normalized, token-aware, ground truth)
      if (context.competitorContext?.items?.length > 0) {
        systemPrompt += `Competitor Analysis Context (Ground truth)\n`;
        systemPrompt += `Summary: ${context.competitorContext.summaryText}\n`;
        const list = context.competitorContext.items.slice(0, 5);
        list.forEach((c: any) => {
          systemPrompt += `- ${c.name}` + (c.industry ? ` (${c.industry})` : '') + (c.position ? ` — Position: ${c.position}` : '') + `\n`;
          if (c.target_market?.length) systemPrompt += `  Target: ${c.target_market.join(', ')}\n`;
          if (c.strengths?.length) systemPrompt += `  Strengths: ${c.strengths.join(', ')}\n`;
          if (c.weaknesses?.length) systemPrompt += `  Weaknesses: ${c.weaknesses.join(', ')}\n`;
          if (typeof c.data_quality_score === 'number' || typeof c.confidence_overall === 'number') {
            systemPrompt += `  Quality: ${c.data_quality_score ?? 'n/a'} | Confidence: ${c.confidence_overall ?? 'n/a'}\n`;
          }
          if (typeof c.sources_count === 'number') systemPrompt += `  Sources: ${c.sources_count}\n`;
        });
        systemPrompt += `Guidance: Treat the above as authoritative user-owned analysis. If external info conflicts, prefer this data. If critical fields are missing, ask clarifying questions before assuming.\n\n`;
      }

      // Add MVP project context
      if (context.mvpProjects?.length > 0) {
        systemPrompt += `Current MVP Projects:\n`;
        context.mvpProjects.forEach((project: any) => {
          systemPrompt += `- ${project.title}: ${project.description}\n`;
          if (project.moscow_priorities?.must?.length > 0) {
            systemPrompt += `  Must-have features: ${project.moscow_priorities.must.join(', ')}\n`;
          }
        });
        systemPrompt += '\n';
      }

      // Add market research insights
      if (context.research.length > 0) {
        systemPrompt += `Recent Market Research:\n`;
        context.research.forEach((research: any) => {
          systemPrompt += `- ${research.title} (${research.research_type})\n`;
          if (research.description) systemPrompt += `  ${research.description}\n`;
        });
        systemPrompt += '\n';
      }

      // Add chat insights
      if (context.insights.length > 0) {
        systemPrompt += `Key Business Insights:\n`;
        context.insights.forEach((insight: any) => {
          systemPrompt += `- ${insight.category}: ${insight.insight}\n`;
        });
      }
    }

    // Call OpenAI API with the user's API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API error:', errorData);
      
      // Check if it's an API key issue
      if (response.status === 401) {
        // Update API key status in database
        await supabase
          .from('api_status_checks')
          .upsert({
            api_type: 'openai',
            user_id: userId,
            status: 'error',
            last_checked: new Date().toISOString(),
            error_message: 'Invalid API key'
          });
          
        return new Response(
          JSON.stringify({ 
            error: 'Your OpenAI API key appears to be invalid. Please check your API key in Settings.',
            code: 'INVALID_API_KEY'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('OpenAI API error: ' + (errorData?.error?.message || 'Unknown error'));
    }

    const aiResponse = await response.json();
    const botMessage = aiResponse.choices[0].message.content;

    // Save the bot's response
    const { error: botMessageError } = await supabase
      .from('chat_messages')
      .insert({
        content: botMessage,
        user_id: userId,
        is_bot: true,
        created_at: new Date().toISOString()
      });

    if (botMessageError) throw botMessageError;

    // Update API key status as working
    await supabase
      .from('api_status_checks')
      .upsert({
        api_type: 'openai',
        user_id: userId,
        status: 'working',
        last_checked: new Date().toISOString(),
        error_message: null
      });

    // Return the generated message to the client as well
    return new Response(JSON.stringify({ success: true, message: botMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-cofounder-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
