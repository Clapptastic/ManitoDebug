import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MicroserviceUpdate {
  id: string;
  name: string;
  status: string;
  version: string;
  port: number;
  baseUrl?: string;
}

export const useRealtimeMicroservices = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to microservices table changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'microservices'
        },
        (payload) => {
          console.log('New microservice:', payload);
          toast({
            title: "New Service Added",
            description: `${payload.new.name} has been registered`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'microservices'
        },
        (payload) => {
          console.log('Microservice updated:', payload);
          const service = payload.new as MicroserviceUpdate;
          toast({
            title: "Service Updated",
            description: `${service.name} status changed to ${service.status}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'microservices'
        },
        (payload) => {
          console.log('Microservice deleted:', payload);
          toast({
            title: "Service Removed",
            description: `Service has been deregistered`,
            variant: "destructive",
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Real-time updates connected for microservices');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('Real-time connection error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, []);

  // Subscribe to edge function metrics for performance monitoring
  useEffect(() => {
    const metricsChannel = supabase
      .channel('edge-function-metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'edge_function_metrics'
        },
        (payload) => {
          console.log('New edge function metrics:', payload);
          // Handle performance alerts
          const metrics = payload.new;
          if (metrics.status === 'error') {
            toast({
              title: "Service Error",
              description: `${metrics.function_name} encountered an error`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
    };
  }, []);

  return { isConnected };
};