
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function analyzeWithGemini(competitor: string, apiKey: string): Promise<any> {
  // Updated: Enforce full unified dataset schema coverage and require citations
  const prompt = `Analyze the company "${competitor}" and return ONLY valid JSON (no markdown) that matches this COMPLETE schema. Include EVERY field even if null. Use null when unknown. Provide direct-URL source_citations for all major claims.
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
    {"field":"string","source":"Specific Source Name","url":"https://direct-link","confidence":0.0,"data_point":"specific info","verification_date":"YYYY-MM-DD"}
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
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();
  
  try {
    const resultText = data.candidates[0].content.parts[0].text;
    // Parse the JSON response, removing any markdown code block syntax if present
    const cleanJson = resultText.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    throw new Error('Failed to parse Gemini analysis result');
  }
}
