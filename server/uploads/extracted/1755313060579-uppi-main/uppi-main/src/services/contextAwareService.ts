import { supabase } from '@/integrations/supabase/client';

export interface BusinessContext {
  industry: string;
  companySize: string;
  stage: string;
  goals: string[];
  challenges: string[];
  competitors: string[];
  targetMarket: string[];
  keyMetrics: string[];
  resources: string[];
  timeline: string;
  documents: Array<{
    title: string;
    category: string;
    description: string;
    tags: string[];
  }>;
  recentActivity: Array<{
    name: string;
    created_at: string;
    status: string;
    data_completeness_score: number;
  }>;
}

export interface ContextualData {
  analyses: Array<{
    name: string;
    industry: string;
    market_position: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }>;
  documents: Array<{
    title: string;
    category: string;
    description: string;
    tags: string[];
  }>;
  recentActivity: Array<{
    name: string;
    created_at: string;
    status: string;
    data_completeness_score: number;
  }>;
  documentation: Array<{
    title: string;
    created_at: string;
    category: string;
  }>;
}

export interface ContextSummary {
  industry: string;
  stage: string;
  primaryGoals: string[];
  keyCompetitors: string[];
  marketInsights: string[];
  recommendations: string[];
  nextSteps: string[];
  dataQuality: number;
}

class ContextAwareService {
  /**
   * Get contextual data for AI processing
   */
  async getContextualData(): Promise<ContextualData> {
    try {
      // Get competitor analyses data
      const { data: analyses } = await supabase
        .from('competitor_analyses')
        .select('name, industry, market_position, strengths, weaknesses, opportunities, threats')
        .limit(5);

      // Get documents data
      const { data: documents } = await supabase
        .from('documents')
        .select('name, description, tags, metadata')
        .limit(5);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('competitor_analyses')
        .select('name, created_at, status, data_quality_score')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get documentation
      const { data: documentation } = await supabase
        .from('documentation')
        .select('title, created_at, category')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        analyses: (analyses || []).map(a => ({
          name: a.name || '',
          industry: a.industry || '',
          market_position: a.market_position || '',
          strengths: a.strengths || [],
          weaknesses: a.weaknesses || [],
          opportunities: a.opportunities || [],
          threats: a.threats || []
        })),
        documents: (documents || []).map(d => ({
          title: d.name || '',
          category: (d.metadata as any)?.category || 'general',
          description: d.description || '',
          tags: d.tags || []
        })),
        recentActivity: (recentActivity || []).map(r => ({
          name: r.name || '',
          created_at: r.created_at || '',
          status: r.status || 'pending',
          data_completeness_score: r.data_quality_score || 0
        })),
        documentation: (documentation || []).map(doc => ({
          title: doc.title || '',
          created_at: doc.created_at || '',
          category: doc.category || 'general'
        }))
      };
    } catch (error) {
      console.error('Error fetching contextual data:', error);
      return {
        analyses: [],
        documents: [],
        recentActivity: [],
        documentation: []
      };
    }
  }

  /**
   * Build business context from user data
   */
  async buildBusinessContext(userId: string): Promise<BusinessContext> {
    try {
      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get company profile data
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get analyses for context
      const { data: analyses } = await supabase
        .from('competitor_analyses')
        .select('industry, analysis_data')
        .eq('user_id', userId)
        .limit(10);

      // Get contextual data
      const contextualData = await this.getContextualData();

      // Build context from available data
      const context: BusinessContext = {
        industry: companyProfile?.industry || 'Technology',
        companySize: companyProfile?.employee_count 
          ? this.categorizeCompanySize(companyProfile.employee_count)
          : 'Startup',
        stage: companyProfile?.funding_stage || 'Early Stage',
        goals: this.extractGoals(companyProfile, analyses),
        challenges: this.extractChallenges(analyses),
        competitors: this.extractCompetitors(analyses),
        targetMarket: this.extractTargetMarket(companyProfile, analyses),
        keyMetrics: this.extractKeyMetrics(companyProfile),
        resources: this.extractResources(companyProfile),
        timeline: this.extractTimeline(companyProfile),
        documents: contextualData.documents,
        recentActivity: contextualData.recentActivity
      };

      return context;
    } catch (error) {
      console.error('Error building business context:', error);
      return this.getDefaultContext();
    }
  }

  /**
   * Generate context summary for AI
   */
  async generateContextSummary(context?: BusinessContext, recentData?: ContextualData): Promise<ContextSummary> {
    // Use provided context or get current user's context
    let businessContext = context;
    if (!businessContext) {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (userId) {
        businessContext = await this.buildBusinessContext(userId);
      } else {
        businessContext = this.getDefaultContext();
      }
    }
    const contextData = recentData || await this.getContextualData();
    const summary: ContextSummary = {
      industry: businessContext.industry,
      stage: businessContext.stage,
      primaryGoals: businessContext.goals.slice(0, 3),
      keyCompetitors: businessContext.competitors.slice(0, 5),
      marketInsights: this.extractMarketInsights(contextData),
      recommendations: this.generateRecommendations(businessContext, contextData),
      nextSteps: this.generateNextSteps(businessContext, contextData),
      dataQuality: this.calculateDataQuality(contextData)
    };

    return summary;
  }

  /**
   * Generate contextual prompt for AI
   */
  generateContextualPrompt(originalPrompt: string, context: ContextualData): string {
    let contextualPrompt = originalPrompt;

    if (context.analyses.length > 0) {
      const analysisContext = context.analyses.map(a => 
        `${a.name} (${a.industry}): Strengths: ${a.strengths.join(', ')}, Weaknesses: ${a.weaknesses.join(', ')}`
      ).join('\n');
      
      contextualPrompt += `\n\nRelevant Analysis Context:\n${analysisContext}`;
    }

    if (context.recentActivity.length > 0) {
      const activityContext = context.recentActivity.map(r =>
        `${r.name} - ${r.status} (Quality Score: ${r.data_completeness_score})`
      ).join('\n');
      
      contextualPrompt += `\n\nRecent Activity:\n${activityContext}`;
    }

    if (context.documents.length > 0) {
      const docContext = context.documents.map(d =>
        `${d.title} (${d.category}): ${d.description}`
      ).join('\n');
      
      contextualPrompt += `\n\nRelevant Documents:\n${docContext}`;
    }

    return contextualPrompt;
  }

  // Helper methods
  private categorizeCompanySize(employeeCount: number): string {
    if (employeeCount < 10) return 'Startup';
    if (employeeCount < 50) return 'Small';
    if (employeeCount < 200) return 'Medium';
    if (employeeCount < 1000) return 'Large';
    return 'Enterprise';
  }

  private extractGoals(companyProfile: any, analyses: any[]): string[] {
    const goals = ['Market Growth', 'Competitive Advantage'];
    
    if (companyProfile?.business_model?.includes('SaaS')) {
      goals.push('Subscription Growth');
    }
    
    if (analyses?.some(a => a.analysis_data?.market_expansion)) {
      goals.push('Market Expansion');
    }

    return goals;
  }

  private extractChallenges(analyses: any[]): string[] {
    const challenges = ['Competition', 'Market Positioning'];
    
    analyses?.forEach(analysis => {
      if (analysis.analysis_data?.challenges) {
        challenges.push(...analysis.analysis_data.challenges);
      }
    });

    return [...new Set(challenges)].slice(0, 5);
  }

  private extractCompetitors(analyses: any[]): string[] {
    const competitors: string[] = [];
    
    analyses?.forEach(analysis => {
      if (analysis.analysis_data?.competitors) {
        competitors.push(...analysis.analysis_data.competitors.map((c: any) => c.name));
      }
    });

    return [...new Set(competitors)].slice(0, 10);
  }

  private extractTargetMarket(companyProfile: any, analyses: any[]): string[] {
    const markets = ['Small to Medium Businesses'];
    
    if (companyProfile?.target_market) {
      markets.push(...companyProfile.target_market);
    }

    return [...new Set(markets)].slice(0, 5);
  }

  private extractKeyMetrics(companyProfile: any): string[] {
    const metrics = ['Revenue Growth', 'Customer Acquisition'];
    
    if (companyProfile?.business_model?.includes('SaaS')) {
      metrics.push('Monthly Recurring Revenue', 'Customer Churn Rate');
    }

    return metrics;
  }

  private extractResources(companyProfile: any): string[] {
    const resources = ['Development Team', 'Marketing Budget'];
    
    if (companyProfile?.funding_info?.total_funding) {
      resources.push('External Funding');
    }

    return resources;
  }

  private extractTimeline(companyProfile: any): string {
    if (companyProfile?.founded_year) {
      const age = new Date().getFullYear() - companyProfile.founded_year;
      if (age < 2) return 'Early Stage';
      if (age < 5) return 'Growth Stage';
      return 'Mature Stage';
    }
    return 'Unknown Stage';
  }

  private extractMarketInsights(data: ContextualData): string[] {
    const insights: string[] = [];
    
    data.analyses.forEach(analysis => {
      if (analysis.opportunities.length > 0) {
        insights.push(...analysis.opportunities.slice(0, 2));
      }
    });

    return [...new Set(insights)].slice(0, 5);
  }

  private generateRecommendations(context: BusinessContext, data: ContextualData): string[] {
    const recommendations = [];
    
    if (data.analyses.length < 3) {
      recommendations.push('Conduct more competitor analyses to improve market understanding');
    }
    
    if (context.competitors.length > 5) {
      recommendations.push('Focus on key competitors to avoid analysis paralysis');
    }
    
    recommendations.push('Develop unique value propositions based on competitor weaknesses');
    
    return recommendations;
  }

  private generateNextSteps(context: BusinessContext, data: ContextualData): string[] {
    const steps = [];
    
    if (data.recentActivity.length === 0) {
      steps.push('Start your first competitor analysis');
    } else {
      steps.push('Review and update existing analyses');
    }
    
    steps.push('Identify key market opportunities');
    steps.push('Develop competitive positioning strategy');
    
    return steps;
  }

  private calculateDataQuality(data: ContextualData): number {
    const totalItems = data.analyses.length + data.documents.length + data.recentActivity.length;
    if (totalItems === 0) return 0;
    
    const qualityScores = data.recentActivity.map(a => a.data_completeness_score).filter(s => s > 0);
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 50;
    
    return Math.round(avgQuality);
  }

  private getDefaultContext(): BusinessContext {
    return {
      industry: 'Technology',
      companySize: 'Startup',
      stage: 'Early Stage',
      goals: ['Market Growth', 'Product Development'],
      challenges: ['Competition', 'Funding'],
      competitors: [],
      targetMarket: ['Small Businesses'],
      keyMetrics: ['Revenue Growth', 'User Acquisition'],
      resources: ['Development Team'],
      timeline: 'Early Stage',
      documents: [],
      recentActivity: []
    };
  }
}

export const contextAwareService = new ContextAwareService();