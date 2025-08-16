import { supabase } from '@/integrations/supabase/client';

/**
 * Forecast data returned by the forecasting service
 */
export interface ForecastData {
  market: string;
  timeframe: string;
  predictions: any[]; // Keeping as any[] until model is finalized
  confidence: number;
}

/**
 * Generates a market forecast for a given timeframe using the user's own OpenAI API key.
 * This calls the Supabase Edge Function `generate-forecast`, which securely fetches
 * the per-user API key (no keys in the frontend) and logs API usage costs.
 */
export const generateForecast = async (timeframe: string): Promise<ForecastData[]> => {
  console.log('Generating market forecast for timeframe:', timeframe);

  const { data, error } = await supabase.functions.invoke('generate-forecast', {
    body: { timeframe },
  });

  if (error) {
    console.error('generate-forecast failed:', error);
    throw error;
  }

  return [
    {
      market: 'General Market',
      timeframe,
      predictions: data?.choices ?? [],
      confidence: 0.8,
    },
  ];
};
