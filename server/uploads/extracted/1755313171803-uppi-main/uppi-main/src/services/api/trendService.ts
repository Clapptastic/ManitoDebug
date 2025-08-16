import { supabase } from '@/integrations/supabase/client';

interface Trend {
  name: string;
  strength: number;
  description: string;
  timeframe: string;
}

interface TrendAnalysis {
  trends: Trend[];
  summary: string;
  recommendations: string[];
}

/**
 * Analyze trends via secure edge function; removes mock key and static example trends
 */
export const analyzeTrends = async (industry: string, timeframe: string = '12 months'): Promise<TrendAnalysis> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a trend analyst specializing in market trends and industry analysis.' },
      { role: 'user', content: `Analyze current and emerging trends in the ${industry} industry over the next ${timeframe}. Provide a concise summary and, if possible, return a JSON array of trend objects with name, strength (0-1), description, and timeframe.` }
    ],
    temperature: 0.6,
    max_tokens: 1500
  };

  const { data: resp, error } = await supabase.functions.invoke('secure-openai-chat', { body: payload });
  if (error) throw error;

  const content: string = resp?.choices?.[0]?.message?.content || '';
  // Best-effort parse for a JSON array of trends if present
  let trends: Trend[] = [];
  try {
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        trends = parsed.map((t: any) => ({
          name: String(t.name || '').trim(),
          strength: Math.min(1, Math.max(0, Number(t.strength) || 0.5)),
          description: String(t.description || '').trim(),
          timeframe: String(t.timeframe || timeframe)
        })).filter(t => t.name);
      }
    }
  } catch {}

  const recommendations: string[] = [];
  return { trends, summary: content, recommendations };
};

export const getIndustryInsights = async (industry: string): Promise<{
  keyMetrics: any[];
  marketSize: string;
  growthRate: string;
  keyPlayers: string[];
}> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an industry research analyst providing market insights.' },
      { role: 'user', content: `Provide key insights for the ${industry} industry including market size, growth rate, and key players.` }
    ],
    temperature: 0.5,
    max_tokens: 800
  };

  const { data: resp, error } = await supabase.functions.invoke('secure-openai-chat', { body: payload });
  if (error) throw error;

  const content: string = resp?.choices?.[0]?.message?.content || '';
  return {
    keyMetrics: [],
    marketSize: content,
    growthRate: '',
    keyPlayers: []
  };
};