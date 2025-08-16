import { supabase } from '@/integrations/supabase/client';

export interface InterviewData {
  questions: string[];
  responses: any[];
  insights: string;
}

/**
 * Generate interview questions using secure edge function (no mock keys)
 * Replaces previous direct OpenAI call with 'dummy-key'.
 */
export const generateInterviewQuestions = async (topic: string): Promise<InterviewData> => {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an interview expert creating research questions.' },
      { role: 'user', content: `Generate interview questions for ${topic}. Return a numbered list.` }
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

  return { questions, responses: [], insights: '' };
};