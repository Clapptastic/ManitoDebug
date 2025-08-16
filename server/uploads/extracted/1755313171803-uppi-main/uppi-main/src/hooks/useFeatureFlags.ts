
import { useState, useEffect } from 'react';
import { FeatureFlags, getFeatureFlags } from '@/config/featureFlags';

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const fetchedFlags = await getFeatureFlags();
        setFlags(fetchedFlags);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load feature flags'));
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, []);

  return { flags, loading, error };
};
