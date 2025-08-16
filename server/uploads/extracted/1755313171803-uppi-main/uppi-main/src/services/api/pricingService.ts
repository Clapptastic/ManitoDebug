import { supabase } from '@/integrations/supabase/client';

export interface PricingData {
  strategy: string;
  pricePoints: number[];
  recommendations: string;
}

/**
 * Analyze pricing strategy via secure edge function; removes mock key and hardcoded price points
 */
export const analyzePricingStrategy = async (product: string): Promise<PricingData> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a pricing strategy expert.' },
      { role: 'user', content: `Analyze pricing strategy for ${product}. Provide recommended price bands if applicable.` }
    ],
    temperature: 0.5,
    max_tokens: 800
  };

  const { data: resp, error } = await supabase.functions.invoke('secure-openai-chat', { body: payload });
  if (error) throw error;

  const content: string = resp?.choices?.[0]?.message?.content || '';
  // Extract numeric price points from content (simple heuristic)
  const pricePoints = Array.from(content.matchAll(/\$?\b(\d+(?:\.\d{1,2})?)\b/g)).slice(0, 6).map(m => Number(m[1])).filter(n => !isNaN(n));

  return {
    strategy: content || 'No strategy available',
    pricePoints,
    recommendations: content || 'No recommendations available'
  };
};