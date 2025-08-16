
export async function analyzeWithOpenAI(competitor: string, apiKey: string): Promise<any> {
  // Updated: Enforce full unified dataset schema coverage and require citations
  const prompt = `Analyze the company "${competitor}" and return ONLY valid JSON (no markdown) that matches the following COMPLETE schema. Include EVERY field exactly as listed, even if the value is null. If a value cannot be verified, set it to null. Provide thorough source_citations with real, accessible URLs for all major claims (revenue_estimate, employee_count, market_position, pricing_strategy, funding_info, technology_analysis, market_share_estimate, strengths/weaknesses, etc.).
{
  "id": null,
  "user_id": null,
  "organization_id": null,
  "name": "string",
  "description": "string|null",

  "status": "pending|analyzing|completed|failed|error|processing",
  "created_at": null,
  "updated_at": null,
  "completed_at": null,

  "website_url": "string|null",
  "website_verified": true|false|null,
  "industry": "string|null",
  "headquarters": "string|null",
  "founded_year": number|null,
  "employee_count": number|null,
  "employee_count_verified": true|false|null,
  "business_model": "string|null",

  "strengths": [],
  "weaknesses": [],
  "opportunities": [],
  "threats": [],
  "swot_analysis": {}|null,

  "market_position": "string|null",
  "target_market": [],
  "customer_segments": [],
  "geographic_presence": [],
  "market_share_estimate": number|null,
  "market_trends": [],

  "competitive_advantages": [],
  "competitive_disadvantages": [],
  "overall_threat_level": "string|null",

  "revenue_estimate": number|null,
  "pricing_strategy": {}|null,
  "funding_info": {}|null,
  "financial_metrics": {}|null,
  "product_portfolio": {}|null,

  "technology_analysis": {}|null,
  "patent_count": number|null,
  "certification_standards": [],
  "innovation_score": number|null,

  "environmental_social_governance": {}|null,
  "social_media_presence": {}|null,
  "key_personnel": {}|null,
  "partnerships": [],

  "data_quality_score": number|null,
  "data_completeness_score": number|null,
  "brand_strength_score": number|null,
  "operational_efficiency_score": number|null,
  "market_sentiment_score": number|null,
  "confidence_scores": {}|null,
  "normalized_scores": {}|null,

  "source_citations": [
    {
      "field": "string",            
      "source": "Specific Source Name",
      "url": "https://direct-link",
      "confidence": 0.0,
      "data_point": "specific cited information",
      "verification_date": "YYYY-MM-DD"
    }
  ],
  "api_responses": {}|null,
  "analysis_data": {}|null,
  "market_position_data": {}|null,
  "technology_innovation_data": {}|null,
  "customer_journey_data": {}|null,
  "last_news_update": "YYYY-MM-DD"|null,
  "last_updated_sources": "string|null",

  "competitor_name": "string|null",
  "company_overview": "string|null",
  "website": "string|null",
  "analyzed_at": "YYYY-MM-DD"|null,
  "api_provider": "string|null",
  "error": "string|null"
}
Rules:
- Use structured objects for pricing_strategy, funding_info, financial_metrics, technology_analysis, etc.
- Arrays should be present (possibly empty) for list-type fields.
- Ensure citations cover all major claims with direct URLs.
- Return ONLY the JSON object above.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Updated to stable, supported model for production
      messages: [
        {
          role: 'system',
          content: 'You are a market research expert. Provide analysis in the exact JSON format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  try {
    const resultText = data.choices[0].message.content;
    const cleanJson = resultText.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse OpenAI analysis result');
  }
}
