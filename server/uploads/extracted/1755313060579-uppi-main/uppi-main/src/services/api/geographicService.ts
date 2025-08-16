import { callOpenAI } from './baseApiService';
import { supabase } from '@/integrations/supabase/client';

export interface GeographicData {
  region: string;
  demographics: any;
  marketPotential: number;
}

export const analyzeGeographicMarket = async (region: string): Promise<GeographicData> => {
  const messages = [
    { role: 'system', content: 'You are a geographic market analyst.' },
    { role: 'user', content: `Analyze the market potential for ${region}.` },
  ];

  const { data, error } = await supabase.functions.invoke('secure-openai-chat', {
    body: {
      messages,
      model: 'gpt-4.1-2025-04-14',
    },
  });

  if (error) throw error;

  return {
    region,
    demographics: data?.response || data?.choices?.[0]?.message?.content || 'No data available',
    marketPotential: 0.7,
  };
};