import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  content: string;
  contentType: 'competitor_analysis' | 'market_research' | 'pricing_data' | 'general';
  sources?: string[];
  context?: any;
}

interface ValidationResult {
  confidence_score: number;
  validation_flags: string[];
  risk_level: 'low' | 'medium' | 'high';
  accuracy_indicators: {
    source_reliability: number;
    data_consistency: number;
    logical_coherence: number;
    factual_verification: number;
  };
  recommendations: string[];
  disclaimer_required: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const { searchParams } = new URL(req.url);
  if (req.method === 'GET' && (searchParams.get('health') === '1' || searchParams.get('health') === 'true')) {
    return new Response(
      JSON.stringify({ success: true, message: 'ok' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!openaiKey && !anthropicKey) {
      throw new Error('No AI provider API keys configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { content, contentType, sources, context }: ValidationRequest = await req.json();

    console.log(`🔍 Starting AI validation for content type: ${contentType}`);

    // Multi-model validation for higher confidence
    const validationResults: ValidationResult[] = [];

    // OpenAI Validation
    if (openaiKey) {
      console.log('📊 Running OpenAI validation...');
      const openaiResult = await validateWithOpenAI(content, contentType, sources, openaiKey);
      validationResults.push(openaiResult);
    }

    // Anthropic Validation
    if (anthropicKey) {
      console.log('🧠 Running Anthropic validation...');
      const anthropicResult = await validateWithAnthropic(content, contentType, sources, anthropicKey);
      validationResults.push(anthropicResult);
    }

    // Cross-reference validation
    console.log('🔗 Running cross-reference validation...');
    const crossRefResult = await crossReferenceValidation(content, sources || []);
    validationResults.push(crossRefResult);

    // Aggregate results with weighted confidence scoring
    const finalResult = aggregateValidationResults(validationResults);

    // Store validation log
    await supabase
      .from('ai_validation_logs')
      .insert([{
        content_type: contentType,
        content_preview: content.substring(0, 500),
        validation_result: finalResult,
        ai_models_used: validationResults.map((_, i) => 
          i === 0 && openaiKey ? 'openai' : 
          i === 1 && anthropicKey ? 'anthropic' : 'cross_reference'
        ),
        sources_checked: sources?.length || 0
      }]);

    console.log(`✅ Validation complete. Final confidence: ${finalResult.confidence_score}%`);

    return new Response(JSON.stringify({
      success: true,
      validation: finalResult,
      disclaimer: generateAIDisclaimer(finalResult),
      metadata: {
        models_used: validationResults.length,
        processing_time: Date.now(),
        recommendation_count: finalResult.recommendations.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI validation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      disclaimer: "⚠️ AI validation failed. This content has not been validated and should be verified independently."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateWithOpenAI(
  content: string, 
  contentType: string, 
  sources: string[] = [], 
  apiKey: string
): Promise<ValidationResult> {
  const prompt = `As an expert validator, analyze this ${contentType} content for accuracy and reliability:

Content: "${content}"
Sources: ${sources.join(', ') || 'None provided'}

Evaluate on a scale of 0-100:
1. Source reliability (based on provided sources)
2. Data consistency (internal logic and coherence)
3. Logical coherence (does it make sense?)
4. Factual verification potential (can claims be verified?)

Identify any red flags, inconsistencies, or areas requiring human verification.
Provide specific recommendations for improving accuracy.

Respond in JSON format:
{
  "confidence_score": number,
  "validation_flags": ["flag1", "flag2"],
  "risk_level": "low|medium|high",
  "accuracy_indicators": {
    "source_reliability": number,
    "data_consistency": number,
    "logical_coherence": number,
    "factual_verification": number
  },
  "recommendations": ["rec1", "rec2"],
  "disclaimer_required": boolean
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are an expert content validator specializing in accuracy assessment.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI validation failed: ${response.statusText}`);
  }

  const result = await response.json();
  const validationText = result.choices[0].message.content;
  
  try {
    return JSON.parse(validationText);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      confidence_score: 50,
      validation_flags: ['parsing_error'],
      risk_level: 'medium',
      accuracy_indicators: {
        source_reliability: 50,
        data_consistency: 50,
        logical_coherence: 50,
        factual_verification: 50
      },
      recommendations: ['Content validation failed - manual review required'],
      disclaimer_required: true
    };
  }
}

async function validateWithAnthropic(
  content: string, 
  contentType: string, 
  sources: string[] = [], 
  apiKey: string
): Promise<ValidationResult> {
  const prompt = `Analyze this ${contentType} content for accuracy and reliability:

Content: "${content}"
Sources: ${sources.join(', ') || 'None provided'}

Rate each aspect (0-100):
- Source credibility and reliability
- Internal data consistency 
- Logical flow and coherence
- Verifiability of claims

Identify concerns and provide improvement suggestions.

Return JSON with confidence_score, validation_flags, risk_level, accuracy_indicators, recommendations, and disclaimer_required.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.1,
      messages: [
        { role: 'user', content: prompt }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic validation failed: ${response.statusText}`);
  }

  const result = await response.json();
  const validationText = result.content[0].text;
  
  try {
    const jsonMatch = validationText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (parseError) {
    return {
      confidence_score: 55,
      validation_flags: ['anthropic_parsing_error'],
      risk_level: 'medium',
      accuracy_indicators: {
        source_reliability: 55,
        data_consistency: 55,
        logical_coherence: 55,
        factual_verification: 55
      },
      recommendations: ['Anthropic validation parsing failed - manual review recommended'],
      disclaimer_required: true
    };
  }
}

async function crossReferenceValidation(content: string, sources: string[]): Promise<ValidationResult> {
  // Basic heuristic validation
  const flags: string[] = [];
  let score = 70; // Base score

  // Check for common reliability indicators
  if (sources.length === 0) {
    flags.push('no_sources_provided');
    score -= 20;
  }

  if (sources.length < 3) {
    flags.push('limited_sources');
    score -= 10;
  }

  // Check for superlative claims without qualification
  const superlatives = ['best', 'worst', 'most', 'least', 'always', 'never', 'all', 'none'];
  const hasUnqualifiedSuperlatives = superlatives.some(word => 
    content.toLowerCase().includes(word) && !content.toLowerCase().includes('according to')
  );
  
  if (hasUnqualifiedSuperlatives) {
    flags.push('unqualified_superlatives');
    score -= 15;
  }

  // Check for specific numerical claims
  const hasSpecificNumbers = /\d+\.?\d*%|\$\d+|\d+,\d+/.test(content);
  if (hasSpecificNumbers && sources.length === 0) {
    flags.push('unsourced_statistics');
    score -= 25;
  }

  const riskLevel = score < 40 ? 'high' : score < 70 ? 'medium' : 'low';

  return {
    confidence_score: Math.max(0, Math.min(100, score)),
    validation_flags: flags,
    risk_level: riskLevel as 'low' | 'medium' | 'high',
    accuracy_indicators: {
      source_reliability: sources.length > 2 ? 80 : sources.length > 0 ? 60 : 30,
      data_consistency: hasUnqualifiedSuperlatives ? 60 : 80,
      logical_coherence: 75,
      factual_verification: hasSpecificNumbers ? (sources.length > 0 ? 85 : 40) : 70
    },
    recommendations: flags.map(flag => {
      switch (flag) {
        case 'no_sources_provided': return 'Add credible sources to support claims';
        case 'limited_sources': return 'Include additional sources for better verification';
        case 'unqualified_superlatives': return 'Qualify absolute statements with source attribution';
        case 'unsourced_statistics': return 'Provide sources for all numerical claims';
        default: return 'Review content for accuracy';
      }
    }),
    disclaimer_required: score < 70 || flags.length > 1
  };
}

function aggregateValidationResults(results: ValidationResult[]): ValidationResult {
  if (results.length === 0) {
    throw new Error('No validation results to aggregate');
  }

  // Weighted average (OpenAI: 40%, Anthropic: 40%, Cross-ref: 20%)
  const weights = [0.4, 0.4, 0.2];
  
  const confidenceScore = results.reduce((sum, result, index) => {
    const weight = weights[index] || 0.2;
    return sum + (result.confidence_score * weight);
  }, 0);

  // Aggregate flags (unique)
  const allFlags = new Set<string>();
  results.forEach(result => {
    result.validation_flags.forEach(flag => allFlags.add(flag));
  });

  // Most conservative risk level
  const riskLevels = results.map(r => r.risk_level);
  const riskLevel = riskLevels.includes('high') ? 'high' : 
                   riskLevels.includes('medium') ? 'medium' : 'low';

  // Average accuracy indicators
  const indicators = results.reduce((acc, result) => ({
    source_reliability: acc.source_reliability + result.accuracy_indicators.source_reliability,
    data_consistency: acc.data_consistency + result.accuracy_indicators.data_consistency,
    logical_coherence: acc.logical_coherence + result.accuracy_indicators.logical_coherence,
    factual_verification: acc.factual_verification + result.accuracy_indicators.factual_verification
  }), { source_reliability: 0, data_consistency: 0, logical_coherence: 0, factual_verification: 0 });

  Object.keys(indicators).forEach(key => {
    indicators[key as keyof typeof indicators] /= results.length;
  });

  // Combine recommendations
  const allRecommendations = results.flatMap(r => r.recommendations);
  const uniqueRecommendations = Array.from(new Set(allRecommendations));

  return {
    confidence_score: Math.round(confidenceScore),
    validation_flags: Array.from(allFlags),
    risk_level: riskLevel,
    accuracy_indicators: indicators,
    recommendations: uniqueRecommendations,
    disclaimer_required: riskLevel !== 'low' || allFlags.size > 0
  };
}

function generateAIDisclaimer(validation: ValidationResult): string {
  const baseDisclaimer = "⚠️ AI-Generated Content: This information was generated using artificial intelligence and may contain inaccuracies. Our confidence score is an estimate only. Please verify all information independently before making business decisions.";
  
  if (validation.risk_level === 'high') {
    return `🚨 ${baseDisclaimer} HIGH RISK: This content has significant reliability concerns and requires thorough verification.`;
  } else if (validation.risk_level === 'medium') {
    return `⚠️ ${baseDisclaimer} MEDIUM RISK: Please exercise caution and verify key claims.`;
  } else {
    return `ℹ️ ${baseDisclaimer} Confidence Score: ${validation.confidence_score}% (estimate only).`;
  }
}