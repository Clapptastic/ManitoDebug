import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatLevelRequest {
  competitorId: string;
  userCompanyData?: {
    revenue?: number;
    employees?: number;
    marketShare?: number;
    industry?: string;
  };
}

interface ThreatFactors {
  marketShareOverlap: number;
  competitiveAdvantages: number;
  growthTrajectory: number;
  financialStrength: number;
  strategicPositioning: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { competitorId, userCompanyData } = await req.json() as ThreatLevelRequest;

    // Get competitor analysis data
    const { data: competitor, error: competitorError } = await supabaseClient
      .from('competitor_analyses')
      .select('*')
      .eq('id', competitorId)
      .single();

    if (competitorError || !competitor) {
      return new Response(
        JSON.stringify({ error: 'Competitor not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate threat factors
    const threatFactors = calculateThreatFactors(competitor, userCompanyData);
    const threatLevel = determineThreatLevel(threatFactors);
    const threatScore = calculateThreatScore(threatFactors);
    const insufficientData = checkDataSufficiency(competitor);

    // Update the competitor analysis with the calculated threat level
    const { error: updateError } = await supabaseClient
      .from('competitor_analyses')
      .update({ 
        overall_threat_level: threatLevel,
        normalized_scores: {
          ...competitor.normalized_scores,
          threat_score: threatScore,
          threat_factors: threatFactors
        }
      })
      .eq('id', competitorId);

    if (updateError) {
      console.error('Error updating threat level:', updateError);
    }

    return new Response(
      JSON.stringify({
        threatLevel,
        threatScore,
        threatFactors,
        insufficientData,
        recommendations: generateRecommendations(threatFactors, insufficientData)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in calculate-threat-level function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateThreatFactors(competitor: any, userCompanyData?: any): ThreatFactors {
  // Market Share Overlap (0-100)
  const marketShareOverlap = calculateMarketShareOverlap(competitor, userCompanyData);
  
  // Competitive Advantages (0-100)
  const competitiveAdvantages = (competitor.competitive_advantages?.length || 0) * 10;
  
  // Growth Trajectory (0-100)
  const growthTrajectory = calculateGrowthTrajectory(competitor);
  
  // Financial Strength (0-100)
  const financialStrength = calculateFinancialStrength(competitor);
  
  // Strategic Positioning (0-100)
  const strategicPositioning = calculateStrategicPositioning(competitor);

  return {
    marketShareOverlap: Math.min(100, marketShareOverlap),
    competitiveAdvantages: Math.min(100, competitiveAdvantages),
    growthTrajectory: Math.min(100, growthTrajectory),
    financialStrength: Math.min(100, financialStrength),
    strategicPositioning: Math.min(100, strategicPositioning)
  };
}

function calculateMarketShareOverlap(competitor: any, userCompanyData?: any): number {
  // Base score from market share estimate
  let score = (competitor.market_share_estimate || 0) * 10;
  
  // Adjust based on industry similarity
  if (userCompanyData?.industry && competitor.industry) {
    if (competitor.industry.toLowerCase() === userCompanyData.industry.toLowerCase()) {
      score += 30;
    }
  }
  
  // Adjust based on target market overlap
  if (competitor.target_market?.length > 0) {
    score += competitor.target_market.length * 5;
  }
  
  return score;
}

function calculateGrowthTrajectory(competitor: any): number {
  let score = 50; // Base score
  
  // Employee count factor
  if (competitor.employee_count) {
    if (competitor.employee_count > 1000) score += 20;
    else if (competitor.employee_count > 100) score += 10;
    else if (competitor.employee_count > 10) score += 5;
  }
  
  // Funding info factor
  if (competitor.funding_info && typeof competitor.funding_info === 'object') {
    const funding = competitor.funding_info;
    if (funding.stage === 'Series C' || funding.stage === 'Series D') score += 15;
    else if (funding.stage === 'Series B') score += 10;
    else if (funding.stage === 'Series A') score += 5;
  }
  
  return score;
}

function calculateFinancialStrength(competitor: any): number {
  let score = 30; // Base score
  
  // Revenue estimate factor
  if (competitor.revenue_estimate) {
    if (competitor.revenue_estimate > 100000000) score += 30; // >100M
    else if (competitor.revenue_estimate > 10000000) score += 20; // >10M
    else if (competitor.revenue_estimate > 1000000) score += 10; // >1M
    else score += 5;
  }
  
  // Financial metrics from analysis data
  if (competitor.financial_metrics && typeof competitor.financial_metrics === 'object') {
    const metrics = competitor.financial_metrics;
    if (metrics.revenue_growth_rate > 0.3) score += 15;
    else if (metrics.revenue_growth_rate > 0.15) score += 10;
    else if (metrics.revenue_growth_rate > 0.05) score += 5;
  }
  
  return score;
}

function calculateStrategicPositioning(competitor: any): number {
  let score = 40; // Base score
  
  // Brand strength score
  if (competitor.brand_strength_score) {
    score += competitor.brand_strength_score * 0.3;
  }
  
  // Innovation score
  if (competitor.innovation_score) {
    score += competitor.innovation_score * 0.2;
  }
  
  // Market position
  if (competitor.market_position) {
    const position = competitor.market_position.toLowerCase();
    if (position.includes('leader') || position.includes('dominant')) score += 20;
    else if (position.includes('challenger') || position.includes('strong')) score += 10;
    else if (position.includes('follower')) score += 5;
  }
  
  return score;
}

function calculateThreatScore(factors: ThreatFactors): number {
  // Weighted average of threat factors
  const weights = {
    marketShareOverlap: 0.25,
    competitiveAdvantages: 0.20,
    growthTrajectory: 0.20,
    financialStrength: 0.20,
    strategicPositioning: 0.15
  };
  
  return Math.round(
    factors.marketShareOverlap * weights.marketShareOverlap +
    factors.competitiveAdvantages * weights.competitiveAdvantages +
    factors.growthTrajectory * weights.growthTrajectory +
    factors.financialStrength * weights.financialStrength +
    factors.strategicPositioning * weights.strategicPositioning
  );
}

function determineThreatLevel(factors: ThreatFactors): string {
  const score = calculateThreatScore(factors);
  
  if (score >= 80) return 'Critical';
  if (score >= 65) return 'High';
  if (score >= 45) return 'Medium';
  if (score >= 25) return 'Low';
  return 'Minimal';
}

function checkDataSufficiency(competitor: any): boolean {
  const requiredFields = [
    'revenue_estimate',
    'employee_count',
    'market_share_estimate',
    'competitive_advantages',
    'market_position',
    'brand_strength_score'
  ];
  
  const missingFields = requiredFields.filter(field => {
    const value = competitor[field];
    return value === null || value === undefined || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'string' && value.trim() === '') ||
           (typeof value === 'number' && value === 0);
  });
  
  // If more than half the required fields are missing, data is insufficient
  return missingFields.length > requiredFields.length / 2;
}

function generateRecommendations(factors: ThreatFactors, insufficientData: boolean): string[] {
  const recommendations: string[] = [];
  
  if (insufficientData) {
    recommendations.push("Gather more comprehensive data about this competitor");
    recommendations.push("Update company profile with missing information");
  }
  
  if (factors.marketShareOverlap > 70) {
    recommendations.push("Monitor market positioning closely - high overlap detected");
  }
  
  if (factors.competitiveAdvantages > 60) {
    recommendations.push("Analyze competitor's key advantages for defensive strategies");
  }
  
  if (factors.financialStrength > 75) {
    recommendations.push("Strong financial position detected - monitor acquisition potential");
  }
  
  return recommendations;
}