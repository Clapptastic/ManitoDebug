
import { ApiProviderConfig } from './types'

export const API_PROVIDERS: Record<string, ApiProviderConfig> = {
  perplexity: {
    baseUrl: 'https://api.perplexity.ai',
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    timeout: 120000,
    rateLimitPerMin: 20
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    timeout: 180000,
    rateLimitPerMin: 15
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1-2025-04-14',
    timeout: 150000,
    rateLimitPerMin: 20
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-1.5-pro',
    timeout: 120000,
    rateLimitPerMin: 30
  }
}
