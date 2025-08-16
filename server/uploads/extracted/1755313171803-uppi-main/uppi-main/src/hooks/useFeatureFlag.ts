/**
 * Feature Flag Hook
 * React hook for accessing feature flags
 */

import { useState, useEffect, useCallback } from 'react';
import { featureFlagService, FeatureFlag } from '@/services/featureFlagService';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/hooks/auth/useAuthContext';

export const useFeatureFlag = (flagName: string) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchEffectiveFlag = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use secure RPC to honor global/org/user scopes
      const { data, error } = await supabase.rpc('get_effective_feature_flag', {
        flag_key_param: flagName,
        user_id_param: user?.id ?? null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setIsEnabled(!!row?.enabled);

      // Also retrieve a representative flag row for metadata/description display
      const flagData = await featureFlagService.getFeatureFlag(flagName);
      setFlag(flagData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flag');
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [flagName, user?.id]);

  useEffect(() => {
    void fetchEffectiveFlag();
  }, [fetchEffectiveFlag]);

  return {
    isEnabled,
    flag,
    loading,
    error,
    refetch: () => {
      featureFlagService.clearCache();
      void fetchEffectiveFlag();
    }
  };
};

export const useFeatureFlags = (flagNames: string[]) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const flagPromises = flagNames.map(flagName => 
          featureFlagService.isFeatureEnabled(flagName)
        );
        
        const results = await Promise.all(flagPromises);
        
        const flagsMap = flagNames.reduce((acc, flagName, index) => {
          acc[flagName] = results[index];
          return acc;
        }, {} as Record<string, boolean>);
        
        setFlags(flagsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      } finally {
        setLoading(false);
      }
    };

    if (flagNames.length > 0) {
      loadFeatureFlags();
    }
  }, [flagNames]);

  return {
    flags,
    loading,
    error,
    isEnabled: (flagName: string) => flags[flagName] || false
  };
};