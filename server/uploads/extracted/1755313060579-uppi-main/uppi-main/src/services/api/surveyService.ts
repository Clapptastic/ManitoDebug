import { supabase } from '@/integrations/supabase/client';

export interface SurveyData {
  questions: string[];
  responses: any[];
  analysis: string;
}

/**
 * Create survey using secure edge function; removes mock key
 */
export const createSurvey = async (topic: string): Promise<SurveyData> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a survey design expert.' },
      { role: 'user', content: `Create survey questions for ${topic}. Return a numbered list.` }
    ],
    temperature: 0.7,
    max_tokens: 800
  };

  const { data: resp, error } = await supabase.functions.invoke('secure-openai-chat', { body: payload });
  if (error) throw error;

  const content: string = resp?.choices?.[0]?.message?.content || '';
  const questions = content
    .split('\n')
    .map(s => s.replace(/^\d+\.?\s*/, '').trim())
    .filter(Boolean);

  return { questions, responses: [], analysis: '' };
};

/**
 * Analyze survey results using secure edge function; removes mock key
 */
export const analyzeSurveyResults = async (responses: any[]): Promise<string> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a data analyst analyzing survey results.' },
      { role: 'user', content: `Analyze these survey responses: ${JSON.stringify(responses)}` }
    ],
    temperature: 0.4,
    max_tokens: 800
  };

  const { data: resp, error } = await supabase.functions.invoke('secure-openai-chat', { body: payload });
  if (error) throw error;

  return resp?.choices?.[0]?.message?.content || 'No analysis available';
};