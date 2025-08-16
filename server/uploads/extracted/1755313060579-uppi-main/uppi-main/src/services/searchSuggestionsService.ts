/**
 * Search Suggestions Service
 * Provides intelligent search suggestions for companies and competitors
 */

import { supabase } from '@/integrations/supabase/client';

export interface SearchSuggestion {
  id: string;
  company_name: string;
  industry?: string;
  primary_domain?: string;
  confidence_score?: number;
}

class SearchSuggestionsService {
  
  async getCompanySuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('id, company_name, industry, website_url, overall_confidence_score')
        .ilike('company_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        company_name: item.company_name,
        industry: item.industry,
        primary_domain: item.website_url || '',
        confidence_score: item.overall_confidence_score
      }));
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
      return [];
    }
  }

  async getCompetitorSuggestions(industry?: string, excludeIds: string[] = []): Promise<SearchSuggestion[]> {
    try {
      let query = supabase
        .from('master_company_profiles')
        .select('id, company_name, industry, website_url, overall_confidence_score')
        .order('overall_confidence_score', { ascending: false })
        .limit(20);

      if (industry) {
        query = query.eq('industry', industry);
      }

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        company_name: item.company_name,
        industry: item.industry,
        primary_domain: item.website_url || '',
        confidence_score: item.overall_confidence_score
      }));
    } catch (error) {
      console.error('Error fetching competitor suggestions:', error);
      return [];
    }
  }

  async searchMasterProfiles(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('*')
        .or(`company_name.ilike.%${query}%,industry.ilike.%${query}%`)
        .order('overall_confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        name: profile.company_name,
        industry: profile.industry,
        domain: profile.website_url || '',
        confidence: profile.overall_confidence_score,
        type: 'master_profile'
      }));
    } catch (error) {
      console.error('Error searching master profiles:', error);
      return [];
    }
  }

  async getIndustrySuggestions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('industry')
        .not('industry', 'is', null);

      if (error) throw error;

      const industries = [...new Set((data || []).map(item => item.industry).filter(Boolean))];
      return industries.sort();
    } catch (error) {
      console.error('Error fetching industry suggestions:', error);
      return [];
    }
  }

  async getPopularSearches(): Promise<SearchSuggestion[]> {
    try {
      // Return popular companies based on confidence score
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('id, company_name, industry, website_url, overall_confidence_score')
        .order('overall_confidence_score', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        company_name: item.company_name,
        industry: item.industry,
        primary_domain: item.website_url || '',
        confidence_score: item.overall_confidence_score
      }));
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return [];
    }
  }
}

export const searchSuggestionsService = new SearchSuggestionsService();