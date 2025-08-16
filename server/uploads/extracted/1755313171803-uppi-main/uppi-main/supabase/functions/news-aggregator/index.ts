import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NewsRequest {
  query: string;
  pageSize?: number;
  sortBy?: 'publishedAt' | 'relevancy';
}

// NewsAPI.org integration
async function fetchNewsAPI(query: string, pageSize: number = 20, apiKey?: string): Promise<any[]> {
  if (!apiKey) {
    console.log('NewsAPI key not provided');
    return [];
  }

  try {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('language', 'en');

    const response = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey }
    });
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI error');
    }

    return data.articles?.map((article: any) => ({
      headline: article.title,
      summary: article.description,
      content: article.content,
      url: article.url,
      source: article.source?.name || 'Unknown',
      published_at: article.publishedAt,
      urlToImage: article.urlToImage,
      author: article.author
    })) || [];
  } catch (error) {
    console.error('NewsAPI fetch error:', error);
    return [];
  }
}

// Calculate relevance score based on query match
function calculateRelevance(article: any, query: string): number {
  const queryLower = query.toLowerCase();
  const headline = (article.headline || '').toLowerCase();
  const summary = (article.summary || '').toLowerCase();
  
  let score = 0;
  
  // Exact query match in headline gets high score
  if (headline.includes(queryLower)) score += 0.8;
  
  // Query words in headline
  const queryWords = queryLower.split(' ');
  for (const word of queryWords) {
    if (word.length > 2 && headline.includes(word)) score += 0.2;
    if (word.length > 2 && summary.includes(word)) score += 0.1;
  }
  
  // Recency bonus (newer articles get higher scores)
  const publishedDate = new Date(article.published_at);
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 1) score += 0.3;
  else if (daysSincePublished < 7) score += 0.2;
  else if (daysSincePublished < 30) score += 0.1;
  
  return Math.min(1, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const query: string = body.query;
    const pageSize: number = body.pageSize ?? 20;
    const sortBy: 'publishedAt' | 'relevancy' = body.sortBy ?? 'publishedAt';
    const analysisId: string | undefined = body.analysisId;
    const companyName: string | undefined = body.companyName ?? query;
    const refreshAll: boolean = body.refreshAll ?? false;

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string | undefined;
    let newsApiKey: string | undefined;

    // If tied to an analysis, resolve user and fetch user-scoped API key via RPC
    if (analysisId) {
      const { data: analysis, error: analysisErr } = await supabase
        .from('competitor_analyses')
        .select('id, user_id')
        .eq('id', analysisId)
        .maybeSingle();

      if (analysisErr || !analysis) {
        return new Response(JSON.stringify({ error: analysisErr?.message || 'Analysis not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = analysis.user_id as string;

      const { data: keyRow, error: keyErr } = await supabase.rpc('manage_api_key', {
        operation: 'get_for_decryption',
        user_id_param: userId,
        provider_param: 'newsapi'
      });
      if (!keyErr && keyRow?.api_key) {
        newsApiKey = keyRow.api_key as string;
      }
    }

    // Fallback: allow env key only if not tied to analysis (legacy behavior preserved)
    if (!newsApiKey && !analysisId) {
      newsApiKey = Deno.env.get('NEWS_API_KEY') || undefined;
    }

    console.log(`Fetching news for query: ${query}`);

    const startTime = Date.now();
    const articles = await fetchNewsAPI(query, pageSize, newsApiKey);

    // Calculate relevance scores
    const articlesWithRelevance = articles.map(article => ({
      ...article,
      relevance_score: calculateRelevance(article, companyName || query)
    }));

    // Sort by relevance or recency
    articlesWithRelevance.sort((a, b) => {
      if (sortBy === 'relevancy') {
        return b.relevance_score - a.relevance_score;
      } else if (sortBy === 'publishedAt') {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
      return 0;
    });

    // Top 5 only
    const topFive = articlesWithRelevance.slice(0, 5);

    // If analysis-bound, persist and track costs
    if (analysisId && userId) {
      if (refreshAll) {
        await supabase.from('news_articles').delete().eq('competitor_analysis_id', analysisId);
      }
      if (topFive.length) {
        const rows = topFive.map((a: any) => ({
          competitor_analysis_id: analysisId,
          title: a.headline,
          description: a.summary,
          url: a.url,
          source: a.source,
          published_at: a.published_at,
          relevance_score: a.relevance_score,
          sentiment_score: null,
          article_content: null,
          api_cost: 0
        }));
        await supabase.from('news_articles').insert(rows);
      }

      // Log api usage (free tier assumed here)
      await supabase.from('api_usage_costs').insert({
        user_id: userId,
        provider: 'newsapi',
        service: 'news',
        endpoint: '/v2/everything',
        usage_count: 1,
        cost_usd: 0,
        response_time_ms: Date.now() - startTime,
        analysis_id: analysisId,
        operation_type: 'news_fetch',
        metadata: { query, returned: topFive.length }
      });
    }

    const response = {
      articles: topFive,
      totalResults: articlesWithRelevance.length,
      query,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('News aggregator error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});