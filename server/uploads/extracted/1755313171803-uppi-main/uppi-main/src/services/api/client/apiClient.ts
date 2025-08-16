import { supabase } from "@/integrations/supabase/client";
import { ApiKeyType } from "@/types/api-keys";

export class ApiClient {
  private static async getApiKey(_keyType: ApiKeyType): Promise<string> {
    // Frontend must not read or expose API keys. Use edge functions instead.
    throw new Error('Direct API key access is not allowed on the client. Use edge functions.');
  }

  static async callOpenAI(messages: Array<{role: string; content: string}>) {
    console.log('Calling secure-openai-chat via edge function with messages:', messages);

    const { data, error } = await supabase.functions.invoke('secure-openai-chat', {
      body: {
        messages,
        model: 'gpt-4.1-2025-04-14',
      },
    });

    if (error) {
      console.error('secure-openai-chat error:', error);
      throw error;
    }

    return data;
  }

  static async callPerplexity(_messages: Array<{role: string; content: string}>) {
    throw new Error('Perplexity client calls must go through edge functions. Use competitor-analysis or news-aggregator.');
  }
}