
import { CompetitorAnalysisResult } from './types.ts';

export async function analyzeWithPerplexity(
  competitor: string,
  apiKey: string
): Promise<CompetitorAnalysisResult> {
  console.log(`Analyzing competitor with Perplexity: ${competitor}`);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a market research expert. Analyze ${competitor} and return a JSON object with these fields:
              {
                "name": "company name",
                "marketShare": number between 0-100,
                "strengths": ["array of strengths"],
                "weaknesses": ["array of weaknesses"],
                "pricing": "pricing info",
                "features": ["array of features"],
                "website": "company website",
                "industry_classification": {
                  "primary": "main industry",
                  "sub_sectors": ["relevant sub-sectors"],
                  "market_cap_range": "size classification",
                  "growth_stage": "startup/growth/mature"
                }
              }`
          },
          { 
            role: 'user', 
            content: `Analyze ${competitor}. Return only the JSON object, no additional text.` 
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Perplexity API response:', data);
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid API response: No content');
    }

    try {
      const cleanContent = content.replace(/```json\n|\n```/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      throw new Error('Failed to parse analysis response');
    }
  } catch (error) {
    console.error('Error in analyzeWithPerplexity:', error);
    throw error;
  }
}
