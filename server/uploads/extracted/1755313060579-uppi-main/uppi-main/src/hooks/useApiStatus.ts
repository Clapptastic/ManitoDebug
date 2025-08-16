
import { useState, useEffect } from 'react';
import { ApiStatusInfo } from '@/types/api-keys/unified';

export const useApiStatus = (provider: string) => {
  const [status, setStatus] = useState<ApiStatusInfo>({
    provider: provider as any,
    status: 'operational',
    isWorking: true,
    exists: false,
    lastChecked: new Date().toISOString(),
    errorMessage: null,
    isActive: true,
    isConfigured: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock status check for now
    setStatus({
      provider: provider as any,
      status: 'operational',
      isWorking: true,
      exists: true,
      lastChecked: new Date().toISOString(),
      errorMessage: null,
      isActive: true,
      isConfigured: true,
      responseTime: Math.floor(Math.random() * 200) + 50
    });
  }, [provider]);

  const checkStatus = async () => {
    setLoading(true);
    // Simulate API status check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStatus({
      provider: provider as any,
      status: 'operational',
      isWorking: true,
      exists: true,
      lastChecked: new Date().toISOString(),
      errorMessage: null,
      isActive: true,
      isConfigured: true,
      responseTime: Math.floor(Math.random() * 200) + 50
    });
    setLoading(false);
  };

  return {
    status,
    loading,
    checkStatus
  };
};
