/**
 * Threat Level Assessment Service
 * Calculates competitive threat levels based on various factors
 */

import { supabase } from '@/integrations/supabase/client';

export interface ThreatAssessment {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: {
    marketSize: number;
    competitorStrength: number;
    marketPosition: number;
    growthRate: number;
    resourceStrength: number;
  };
  recommendations: string[];
}

class ThreatLevelService {
  
  async assessCompetitorThreat(competitorId: string): Promise<ThreatAssessment> {
    try {
      const competitor = await this.getCompetitorData(competitorId);
      
      if (!competitor) {
        return this.getDefaultAssessment();
      }

      const factors = this.calculateThreatFactors(competitor);
      const score = this.calculateOverallThreatScore(factors);
      const threatLevel = this.determineThreatLevel(score);
      const recommendations = this.generateRecommendations(threatLevel, factors);

      return {
        threatLevel,
        score,
        factors,
        recommendations
      };
    } catch (error) {
      console.error('Error assessing competitor threat:', error);
      return this.getDefaultAssessment();
    }
  }

  async assessMarketThreat(industry: string): Promise<ThreatAssessment> {
    try {
      const competitors = await this.getIndustryCompetitors(industry);
      
      if (competitors.length === 0) {
        return this.getDefaultAssessment();
      }

      // Calculate aggregate threat from all competitors in the industry
      const assessments = await Promise.all(
        competitors.map(comp => this.assessCompetitorThreat(comp.id))
      );

      const avgScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0) / assessments.length;
      const threatLevel = this.determineThreatLevel(avgScore);
      
      // Aggregate factors
      const factors = {
        marketSize: this.calculateMarketSizeScore(competitors),
        competitorStrength: avgScore,
        marketPosition: this.calculateMarketPositionScore(competitors),
        growthRate: this.calculateGrowthRateScore(competitors),
        resourceStrength: this.calculateResourceStrengthScore(competitors)
      };

      const recommendations = this.generateMarketRecommendations(threatLevel, factors);

      return {
        threatLevel,
        score: avgScore,
        factors,
        recommendations
      };
    } catch (error) {
      console.error('Error assessing market threat:', error);
      return this.getDefaultAssessment();
    }
  }

  private async getCompetitorData(competitorId: string) {
    try {
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', competitorId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching competitor data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompetitorData:', error);
      return null;
    }
  }

  private async getIndustryCompetitors(industry: string) {
    try {
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('id, name, industry, employee_count, analysis_data')
        .eq('industry', industry)
        .eq('status', 'completed')
        .limit(50);

      if (error) {
        console.error('Error fetching industry competitors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getIndustryCompetitors:', error);
      return [];
    }
  }

  private calculateThreatFactors(competitor: any) {
    // Check required fields (using available fields from schema)
    const hasRevenue = competitor.analysis_data?.revenue_estimate && competitor.analysis_data.revenue_estimate > 0;
    const hasEmployees = competitor.employee_count && competitor.employee_count > 0;
    const hasMarketShare = competitor.analysis_data?.market_share_estimate && competitor.analysis_data.market_share_estimate > 0;
    const hasAdvantages = competitor.analysis_data?.competitive_advantages && competitor.analysis_data.competitive_advantages.length > 0;
    const hasPosition = competitor.market_position && competitor.market_position.trim() !== '';
    const hasBrandStrength = competitor.analysis_data?.brand_strength_score && competitor.analysis_data.brand_strength_score > 0;

    return {
      marketSize: this.calculateMarketSizeFactor(competitor),
      competitorStrength: this.calculateCompetitorStrengthFactor(competitor),
      marketPosition: this.calculateMarketPositionFactor(competitor),
      growthRate: this.calculateGrowthRateFactor(competitor),
      resourceStrength: this.calculateResourceStrengthFactor(competitor)
    };
  }

  private calculateMarketSizeFactor(competitor: any): number {
    // Base score on industry and available market data
    const industryMultipliers: Record<string, number> = {
      'technology': 85,
      'healthcare': 80,
      'finance': 75,
      'retail': 70,
      'manufacturing': 65,
      'default': 60
    };

    const industry = competitor.industry?.toLowerCase() || 'default';
    const baseScore = industryMultipliers[industry] || industryMultipliers.default;

    // Adjust based on employee count as a proxy for market reach
    if (competitor.employee_count) {
      if (competitor.employee_count > 10000) return Math.min(100, baseScore + 15);
      if (competitor.employee_count > 1000) return Math.min(100, baseScore + 10);
      if (competitor.employee_count > 100) return Math.min(100, baseScore + 5);
    }

    return baseScore;
  }

  private calculateCompetitorStrengthFactor(competitor: any): number {
    let score = 50;

    // Financial strength
    if (competitor.analysis_data?.revenue_estimate) {
      const revenue = competitor.analysis_data.revenue_estimate;
      if (revenue > 1000000000) score += 20; // > $1B
      else if (revenue > 100000000) score += 15; // > $100M
      else if (revenue > 10000000) score += 10; // > $10M
      else if (revenue > 1000000) score += 5; // > $1M
    }

    // Employee count
    if (competitor.employee_count) {
      if (competitor.employee_count > 5000) score += 15;
      else if (competitor.employee_count > 1000) score += 10;
      else if (competitor.employee_count > 100) score += 5;
    }

    // Brand strength
    if (competitor.analysis_data?.brand_strength_score) {
      score += Math.round(competitor.analysis_data.brand_strength_score * 0.2);
    }

    return Math.min(100, score);
  }

  private calculateMarketPositionFactor(competitor: any): number {
    let score = 50;

    // Market position assessment
    if (competitor.market_position) {
      const position = competitor.market_position.toLowerCase();
      if (position.includes('leader') || position.includes('dominant')) score += 25;
      else if (position.includes('strong') || position.includes('major')) score += 15;
      else if (position.includes('emerging') || position.includes('growing')) score += 10;
      else if (position.includes('niche') || position.includes('specialized')) score += 5;
    }

    // Competitive advantages
    if (competitor.analysis_data?.competitive_advantages) {
      const advantages = competitor.analysis_data.competitive_advantages;
      score += Math.min(20, advantages.length * 3);
    }

    return Math.min(100, score);
  }

  private calculateGrowthRateFactor(competitor: any): number {
    // Default growth estimation based on industry and size
    let score = 60;

    // Industry growth factors
    const industryGrowth: Record<string, number> = {
      'technology': 80,
      'healthcare': 75,
      'renewable energy': 85,
      'e-commerce': 80,
      'default': 60
    };

    const industry = competitor.industry?.toLowerCase() || 'default';
    score = industryGrowth[industry] || industryGrowth.default;

    // Adjust based on founding year (younger companies may grow faster)
    if (competitor.founded_year) {
      const age = new Date().getFullYear() - competitor.founded_year;
      if (age < 5) score += 10; // Startup boost
      else if (age < 10) score += 5;
    }

    return Math.min(100, score);
  }

  private calculateResourceStrengthFactor(competitor: any): number {
    let score = 50;

    // Financial resources
    if (competitor.analysis_data?.revenue_estimate) {
      const revenue = competitor.analysis_data.revenue_estimate;
      if (revenue > 500000000) score += 20;
      else if (revenue > 50000000) score += 15;
      else if (revenue > 5000000) score += 10;
    }

    // Human resources
    if (competitor.employee_count) {
      if (competitor.employee_count > 2000) score += 15;
      else if (competitor.employee_count > 500) score += 10;
      else if (competitor.employee_count > 50) score += 5;
    }

    // Technology/Innovation capacity (based on industry)
    const techIndustries = ['technology', 'software', 'ai', 'biotech'];
    if (techIndustries.some(tech => competitor.industry?.toLowerCase().includes(tech))) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private calculateOverallThreatScore(factors: any): number {
    const weights = {
      marketSize: 0.2,
      competitorStrength: 0.3,
      marketPosition: 0.25,
      growthRate: 0.15,
      resourceStrength: 0.1
    };

    return Math.round(
      factors.marketSize * weights.marketSize +
      factors.competitorStrength * weights.competitorStrength +
      factors.marketPosition * weights.marketPosition +
      factors.growthRate * weights.growthRate +
      factors.resourceStrength * weights.resourceStrength
    );
  }

  private determineThreatLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
  }

  private generateRecommendations(threatLevel: string, factors: any): string[] {
    const recommendations: string[] = [];

    switch (threatLevel) {
      case 'critical':
        recommendations.push('Immediate strategic response required');
        recommendations.push('Consider defensive strategies and market positioning');
        recommendations.push('Accelerate innovation and differentiation efforts');
        break;
      case 'high':
        recommendations.push('Develop competitive countermeasures');
        recommendations.push('Strengthen unique value propositions');
        recommendations.push('Monitor competitor activities closely');
        break;
      case 'medium':
        recommendations.push('Continue monitoring competitive landscape');
        recommendations.push('Focus on core strengths and customer relationships');
        break;
      case 'low':
        recommendations.push('Maintain current competitive position');
        recommendations.push('Look for growth opportunities');
        break;
    }

    return recommendations;
  }

  private generateMarketRecommendations(threatLevel: string, factors: any): string[] {
    const recommendations = this.generateRecommendations(threatLevel, factors);
    
    recommendations.push('Analyze market consolidation trends');
    recommendations.push('Evaluate strategic partnership opportunities');
    
    return recommendations;
  }

  private calculateMarketSizeScore(competitors: any[]): number {
    return competitors.length > 10 ? 80 : Math.min(80, competitors.length * 8);
  }

  private calculateMarketPositionScore(competitors: any[]): number {
    return 65; // Default market position score
  }

  private calculateGrowthRateScore(competitors: any[]): number {
    return 70; // Default growth rate score
  }

  private calculateResourceStrengthScore(competitors: any[]): number {
    const avgEmployees = competitors.reduce((sum, comp) => sum + (comp.employee_count || 0), 0) / competitors.length;
    return Math.min(100, avgEmployees / 100);
  }

  private getDefaultAssessment(): ThreatAssessment {
    return {
      threatLevel: 'medium',
      score: 50,
      factors: {
        marketSize: 50,
        competitorStrength: 50,
        marketPosition: 50,
        growthRate: 50,
        resourceStrength: 50
      },
      recommendations: ['Insufficient data for comprehensive assessment', 'Gather more competitor intelligence']
    };
  }
}

export const threatLevelService = new ThreatLevelService();