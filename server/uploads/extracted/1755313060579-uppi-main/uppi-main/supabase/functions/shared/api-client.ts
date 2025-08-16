/**
 * Provider-aware API client used by edge functions.
 * - Derives baseUrl and default model from API_PROVIDERS
 * - Accepts per-user apiKey via options (preferred), falls back to Deno.env for legacy
 * - Normalizes response extraction across providers and safely parses JSON if present
 */
import { API_PROVIDERS } from './api-providers'

export class ApiClient {
  static async callApi<T>(
    provider: string,
    endpoint: string,
    payload: any,
    options?: { apiKey?: string; model?: string }
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const startTime = Date.now();
    let status = 500;
    
    try {
      const provKey = provider.toLowerCase();
      const provCfg = API_PROVIDERS[provKey];
      if (!provCfg) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      const apiKey = options?.apiKey || Deno.env.get(`${provKey.toUpperCase()}_API_KEY`);
      if (!apiKey) {
        throw new Error(`${provKey.toUpperCase()} API key not configured`);
      }

      const baseUrl = provCfg.baseUrl.replace(/\/$/, '');
      const url = `${baseUrl}${endpoint}`;
      const model = options?.model || payload?.model || provCfg.defaultModel;

      console.log(`Calling ${provKey} ${url} with model ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          model,
        }),
      });

      status = response.status;
      console.log(`${provKey} API response status:`, status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`${provKey} API error:`, errorData);
        throw new Error(`${provKey} API error: ${errorData.error?.message || errorData.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log(`${provKey} API response received successfully`);

      // Unified content extraction across providers
      let completionText: string | null = null;
      try {
        // OpenAI / Perplexity style
        completionText = data?.choices?.[0]?.message?.content
          ?? data?.choices?.[0]?.text
          // Anthropic messages API
          ?? (Array.isArray(data?.content) ? data.content.map((c: any) => c.text || c).join('\n') : null)
          // Google Gemini
          ?? (Array.isArray(data?.candidates) ? (data.candidates[0]?.content?.parts?.map((p: any) => p.text).join('\n') || null) : null);
      } catch (_) {
        // noop
      }

      let parsedData: any = null;
      if (completionText) {
        try {
          parsedData = JSON.parse(completionText);
        } catch {
          parsedData = completionText;
        }
      } else {
        parsedData = data;
      }

      return { success: true, data: parsedData };
    } catch (error: any) {
      console.error(`Error calling ${provider} API:`, error);
      return { success: false, error: error?.message || 'Unknown error' };
    } finally {
      const elapsed = Date.now() - startTime;
      console.log(`[${provider}] API call finished in ${elapsed}ms with status ${status}`);
    }
  }
}
