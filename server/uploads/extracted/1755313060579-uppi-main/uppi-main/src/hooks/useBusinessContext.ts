
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessContext } from '@/types/business';

export interface UseBusinessContextReturn {
  context: BusinessContext;
  isLoading: boolean;
  error: string;
  refreshContext: () => Promise<void>;
}

export const useBusinessContext = (): UseBusinessContextReturn => {
  const [context, setContext] = useState<BusinessContext>({
    competitors: [],
    documents: [],
    recentActivity: [],
    companyProfiles: [],
    competitorAnalyses: [],
    businessPlans: [],
    userPreferences: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBusinessContext = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Add a small delay to ensure RLS policies are properly applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch data with error handling for each table
      let profiles = [];
      let competitors = [];
      let plans = [];

      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id);

        if (profilesError && profilesError.code !== '42501') {
          console.warn('Error fetching company profiles:', profilesError);
        } else if (!profilesError) {
          profiles = profilesData || [];
        }
      } catch (err) {
        console.warn('Failed to fetch company profiles:', err);
      }

      try {
        const { data: competitorsData, error: competitorsError } = await supabase
          .from('competitor_analyses')
          .select('*')
          .eq('user_id', user.id);

        if (competitorsError && competitorsError.code !== '42501') {
          console.warn('Error fetching competitor analyses:', competitorsError);
        } else if (!competitorsError) {
          competitors = competitorsData || [];
        }
      } catch (err) {
        console.warn('Failed to fetch competitor analyses:', err);
      }

      try {
        const { data: plansData, error: plansError } = await supabase
          .from('business_plans')
          .select('*')
          .eq('user_id', user.id);

        if (plansError && plansError.code !== '42501') {
          console.warn('Error fetching business plans:', plansError);
        } else if (!plansError) {
          plans = plansData || [];
        }
      } catch (err) {
        console.warn('Failed to fetch business plans:', err);
      }

      setContext({
        competitors: [],
        documents: [],
        recentActivity: [],
        companyProfiles: profiles,
        competitorAnalyses: competitors,
        businessPlans: plans,
        userPreferences: {}
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch business context';
      setError(errorMessage);
      console.error('Error fetching business context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContext = async () => {
    await fetchBusinessContext();
  };

  useEffect(() => {
    fetchBusinessContext();
  }, []);

  return {
    context,
    isLoading,
    error,
    refreshContext
  };
};
