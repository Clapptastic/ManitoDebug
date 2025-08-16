
/**
 * Hook to determine if the application should display mock data.
 * 
 * UPDATED: Always returns false to ensure real data is used.
 */
import { useEffect, useState } from 'react';

export function useMockData(featureKey?: string): { showMock: boolean; reason: string } {
  const [showMock] = useState<boolean>(false);
  const [reason] = useState<string>('');

  useEffect(() => {
    // Always use real data - no mock data in production
    console.log('Mock data disabled - using real data only');
  }, [featureKey]);

  return { showMock: false, reason: '' };
}

export default useMockData;
