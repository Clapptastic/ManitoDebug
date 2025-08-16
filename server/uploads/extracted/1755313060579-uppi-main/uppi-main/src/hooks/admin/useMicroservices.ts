import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFeatureFlags } from '@/config/featureFlags';

interface Microservice {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'active' | 'inactive' | 'maintenance';
  version: string;
  port: number;
  is_active?: boolean;
  baseUrl?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Admin microservices hook
 * - Reads feature flags to avoid invoking Edge Functions when microservices are disabled
 * - Provides CRUD-like helpers via the 'microservices' and 'microservice-health' edge functions
 */
export const useMicroservices = () => {
  const [microservices, setMicroservices] = useState<Microservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMicroservices = useCallback(async () => {
    try {
      setIsLoading(true);
      // Respect feature flags to avoid noisy errors when disabled
      const flags = await getFeatureFlags();
      if (!flags.microservices) {
        setMicroservices([]);
        setError(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('microservices', {
        method: 'GET'
      });

      if (error) throw error;

      if (data?.success) {
        setMicroservices(data.data || []);
      } else {
        setMicroservices([]);
      }
    } catch (err: any) {
      console.error('Error fetching microservices:', err);
      setError(err.message);
      setMicroservices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMicroservices();
  }, [fetchMicroservices]);

  const addMicroservice = async (microservice: Omit<Microservice, 'id'>) => {
    try {
      const { data, error } = await supabase.functions.invoke('microservices', {
        method: 'POST',
        body: {
          name: microservice.name,
          version: microservice.version,
          baseUrl: `${window.location.protocol}//${window.location.hostname}:${microservice.port}`,
          port: microservice.port,
          status: microservice.status
        }
      });

      if (error) throw error;

      if (data?.success) {
        await fetchMicroservices(); // Refresh the list
        return { success: true };
      } else {
        throw new Error(data?.error || 'Failed to add microservice');
      }
    } catch (err: any) {
      console.error('Error adding microservice:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add microservice",
        variant: "destructive",
      });
      return { success: false, error: err.message };
    }
  };

  const removeMicroservice = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('microservices', {
        method: 'DELETE',
        body: { id }
      });

      if (error) throw error;

      if (data?.success) {
        setMicroservices(prev => prev.filter(m => m.id !== id));
        toast({
          title: "Success",
          description: "Microservice removed successfully",
        });
        return { success: true };
      } else {
        throw new Error(data?.error || 'Failed to remove microservice');
      }
    } catch (err: any) {
      console.error('Error removing microservice:', err);
      toast({
        title: "Error", 
        description: err.message || "Failed to remove microservice",
        variant: "destructive",
      });
      return { success: false, error: err.message };
    }
  };

  const updateMicroservice = async (id: string, updates: Partial<Microservice>) => {
    try {
      const { data, error } = await supabase.functions.invoke('microservices', {
        method: 'PUT',
        body: { id, ...updates }
      });

      if (error) throw error;

      if (data?.success) {
        await fetchMicroservices(); // Refresh the list
        toast({
          title: "Success",
          description: "Microservice updated successfully",
        });
        return { success: true };
      } else {
        throw new Error(data?.error || 'Failed to update microservice');
      }
    } catch (err: any) {
      console.error('Error updating microservice:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update microservice", 
        variant: "destructive",
      });
      return { success: false, error: err.message };
    }
  };

  const refetch = useCallback(async () => {
    await fetchMicroservices();
  }, [fetchMicroservices]);

  const checkServiceHealth = async (service: Microservice) => {
    try {
      const flags = await getFeatureFlags();
      if (!flags.microservices) {
        return { healthy: false, status: 'disabled' };
      }

      const { data, error } = await supabase.functions.invoke('microservice-health', {
        body: {
          serviceUrl: service.baseUrl || `${window.location.protocol}//${window.location.hostname}:${service.port}`,
          healthCheckPath: '/health'
        }
      });

      if (error) throw error;

      return {
        healthy: data?.healthy || false,
        status: data?.healthy ? 'healthy' : 'unhealthy',
        responseTime: data?.responseTime
      };
    } catch (err: any) {
      console.error('Error checking service health:', err);
      return { healthy: false, status: 'unhealthy', error: err.message };
    }
  };

  return {
    microservices,
    isLoading,
    error,
    addMicroservice,
    removeMicroservice,
    updateMicroservice,
    refetch,
    checkServiceHealth
  };
};