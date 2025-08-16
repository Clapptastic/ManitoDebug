
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Mock interface for support staff since the table doesn't exist
interface SupportStaff {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  availability: string;
}

export const useSubscriptionSupport = () => {
  const [supportStaff, setSupportStaff] = useState<SupportStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupportStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data since support_staff table doesn't exist
      const mockSupportStaff: SupportStaff[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Senior Support Engineer',
          status: 'online',
          availability: 'Available now'
        },
        {
          id: '2', 
          name: 'Mike Chen',
          role: 'Technical Support Specialist',
          status: 'busy',
          availability: 'Back in 15 minutes'
        }
      ];

      setSupportStaff(mockSupportStaff);
    } catch (err) {
      console.error('Error fetching support staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch support staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportStaff();
  }, []);

  return {
    supportStaff,
    loading,
    error,
    refetch: fetchSupportStaff
  };
};
