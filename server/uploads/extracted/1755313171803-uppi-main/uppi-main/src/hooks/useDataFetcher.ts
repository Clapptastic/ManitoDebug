import { useState, useEffect } from 'react';

export const useDataFetcher = (endpoint?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (endpoint) {
      setIsLoading(true);
      // Placeholder implementation
      setTimeout(() => {
        setData([]);
        setIsLoading(false);
      }, 100);
    }
  }, [endpoint]);

  return { data, isLoading, error };
};