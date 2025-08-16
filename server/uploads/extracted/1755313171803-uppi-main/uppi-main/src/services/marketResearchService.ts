import { supabase } from '@/integrations/supabase/client';
import { PostgrestResponse } from '@supabase/supabase-js';

export interface MarketResearch {
  id: string;
  user_id: string;
  business_idea: string;
  target_market: string;
  market_size_estimate: number;
  competitive_analysis: any;
  validation_score: number;
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface MarketTrend {
  id: string;
  industry: string;
  trend_data: any;
  growth_rate: number;
  market_size: number;
  created_at: string;
}

export class MarketResearchService {
  async analyzeMarket(businessIdea: string, targetMarket: string): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Call edge function for market analysis
    const { data: analysisData } = await supabase.functions.invoke('market-research-analyzer', {
      body: { businessIdea, targetMarket }
    });

    // Store results in chat_sessions table as placeholder
    return await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.user.id,
        title: `Market Analysis: ${businessIdea}`,
        metadata: {
          business_idea: businessIdea,
          target_market: targetMarket,
          market_size_estimate: analysisData?.marketSize || 0,
          competitive_analysis: analysisData?.competitors || {},
          validation_score: analysisData?.validationScore || 0,
          recommendations: analysisData?.recommendations || []
        }
      })
      .select()
      .single();
  }

  async getMarketResearch(): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    return await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });
  }

  async getMarketTrends(industry?: string): Promise<any> {
    let query = supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (industry) {
      query = query.ilike('title', `%${industry}%`);
    }

    return await query;
  }

  async validateBusinessIdea(idea: string): Promise<{ score: number; insights: string[] }> {
    const { data } = await supabase.functions.invoke('business-idea-validator', {
      body: { idea }
    });

    return {
      score: data?.validationScore || 0,
      insights: data?.insights || []
    };
  }
}

export const marketResearchService = new MarketResearchService();