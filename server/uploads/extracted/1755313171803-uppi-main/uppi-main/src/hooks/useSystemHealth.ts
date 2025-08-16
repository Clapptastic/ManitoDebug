
import { useState, useEffect } from 'react';
import { SystemHealthData, SystemComponent } from '@/types/system-health';

export const useSystemHealth = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthData>({
    status: 'operational',
    uptime: 0,
    response_time: 0,
    last_check: new Date().toISOString(),
    components: [],
    performanceMetrics: [],
    alerts: [],
    lastUpdated: new Date().toISOString()
  });

  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        // Mock data for now
        setSystemHealth({
          status: 'operational',
          uptime: 99.9,
          response_time: Math.floor(Math.random() * 100),
          last_check: new Date().toISOString(),
          components: [],
          performanceMetrics: [
            {
              id: '1',
              metric_name: 'CPU Usage',
              value: Math.random() * 100,
              unit: '%',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              metric_name: 'Memory Usage',
              value: Math.random() * 100,
              unit: '%',
              timestamp: new Date().toISOString()
            }
          ],
          alerts: [],
          lastUpdated: new Date().toISOString()
        });

        setComponents([
          {
            id: 'database',
            name: 'Database',
            status: 'operational',
            response_time: Math.floor(Math.random() * 100),
            uptime_percentage: 99.9,
            last_checked: new Date().toISOString(),
            description: 'Primary database connection'
          },
          {
            id: 'api',
            name: 'API Server',
            status: 'operational', 
            response_time: Math.floor(Math.random() * 50),
            uptime_percentage: 99.8,
            last_checked: new Date().toISOString(),
            description: 'Main API endpoints'
          }
        ]);
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
    
    // Set up polling with proper cleanup
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent infinite loops

  return {
    systemHealth,
    components,
    loading,
    refetch: () => setLoading(true)
  };
};
