
import { useState, useEffect } from 'react';
import { TrackedError } from '@/types/core/interfaces';

export const useErrorTracker = () => {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        // Mock error data for now
        const mockErrors: TrackedError[] = [
          {
            id: '1',
            message: 'Failed to fetch competitor data',
            source: 'api',
            timestamp: new Date().toISOString(),
            handled: false,
            details: { endpoint: '/api/competitors' }
          },
          {
            id: '2',
            message: 'Authentication token expired',
            source: 'auth',
            timestamp: new Date().toISOString(),
            handled: true,
            details: { user_id: 'user123' }
          }
        ];

        setErrors(mockErrors);
      } catch (error) {
        console.error('Error fetching error tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    loading,
    clearErrors
  };
};
