
export const API_COSTS = {
  OPENAI_COST_PER_1K_TOKENS: 0.01,
  PERPLEXITY_COST_PER_QUERY: 0.002,
  ANTHROPIC_COST_PER_QUERY: 0.015,
  GEMINI_COST_PER_QUERY: 0.01,
  DEFAULT_COST_PER_QUERY: 0.02
};

export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  PERPLEXITY: 'https://api.perplexity.ai/chat/completions',
  ANTHROPIC: 'https://api.anthropic.com/v1/messages',
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
};

export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export const calculateCostForProvider = (
  provider: string,
  tokens?: number,
  duration?: number
): number => {
  switch (provider.toLowerCase()) {
    case 'openai':
      return tokens ? (tokens / 1000) * API_COSTS.OPENAI_COST_PER_1K_TOKENS : API_COSTS.DEFAULT_COST_PER_QUERY;
    case 'perplexity':
      return API_COSTS.PERPLEXITY_COST_PER_QUERY;
    case 'anthropic':
      return API_COSTS.ANTHROPIC_COST_PER_QUERY;
    case 'gemini':
      return API_COSTS.GEMINI_COST_PER_QUERY;
    default:
      return API_COSTS.DEFAULT_COST_PER_QUERY;
  }
};
