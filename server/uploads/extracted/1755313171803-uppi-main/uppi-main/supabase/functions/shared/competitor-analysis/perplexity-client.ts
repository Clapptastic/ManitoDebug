
export async function analyzeWithPerplexity(competitor: string, apiKey: string): Promise<any> {
  console.log(`Starting Perplexity analysis for competitor: ${competitor}`);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'system',
          content: 'You are a market research expert with access to real-time web data. For every data point you provide, you MUST include specific source URLs where the information was found. Always cite your sources with direct links to the original content.'
        }, {
          role: 'user',
          content: `Analyze ${competitor} and return ONLY a JSON object that includes EVERY field from this COMPLETE schema. Include all fields even if null. Use null when unknown. Provide direct-URL source_citations for all major claims (revenue_estimate, employee_count, market_position, pricing_strategy, funding_info, technology_analysis, market_share_estimate, strengths/weaknesses, etc.).
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
}
Return only valid JSON.`
        }],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Perplexity API');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure');
    }

    const content = data.choices[0].message.content.trim();
    console.log('Raw content:', content);

    // Try to parse the JSON response
    try {
      const parsedResult = JSON.parse(content);
      
      // Validate and normalize the result with source citations
      return {
        name: parsedResult.name || competitor,
        market_share: Number(parsedResult.market_share) || 0,
        strengths: Array.isArray(parsedResult.strengths) ? parsedResult.strengths : [],
        weaknesses: Array.isArray(parsedResult.weaknesses) ? parsedResult.weaknesses : [],
        pricing: parsedResult.pricing || "Not available",
        features: Array.isArray(parsedResult.features) ? parsedResult.features : [],
        company_overview: parsedResult.company_overview || "Not available",
        market_position: parsedResult.market_position || "Not available",
        product_offerings: parsedResult.product_offerings || "Not available",
        source_citations: Array.isArray(parsedResult.source_citations) ? parsedResult.source_citations : [],
        data_verification: parsedResult.data_verification || {
          sources_checked: 0,
          cross_verified: false,
          last_updated: new Date().toISOString().split('T')[0]
        }
      };
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      throw new Error(`Failed to parse analysis response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in analyzeWithPerplexity:', error);
    throw error;
  }
}
