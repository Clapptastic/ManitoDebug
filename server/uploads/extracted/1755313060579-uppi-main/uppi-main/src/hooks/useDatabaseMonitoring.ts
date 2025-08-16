
import { useState, useEffect } from 'react';
import { QueryMetric, TableStats } from '@/types/core/interfaces';

export const useDatabaseMonitoring = () => {
  const [queryMetrics, setQueryMetrics] = useState<QueryMetric[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Mock data for now
        const mockQueryMetrics: QueryMetric[] = [
          {
            id: '1',
            query: 'SELECT * FROM competitor_analyses',
            execution_time_ms: 150,
            rows_affected: 25,
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            query: 'SELECT * FROM api_keys WHERE user_id = ?',
            execution_time_ms: 45,
            rows_affected: 5,
            timestamp: new Date().toISOString()
          }
        ];

        const mockTableStats: TableStats[] = [
          {
            table_name: 'competitor_analyses',
            row_count: 150,
            size_mb: 25.5,
            last_analyzed: new Date().toISOString()
          },
          {
            table_name: 'api_keys',
            row_count: 45,
            size_mb: 2.1,
            last_analyzed: new Date().toISOString()
          }
        ];

        setQueryMetrics(mockQueryMetrics);
        setTableStats(mockTableStats);
      } catch (error) {
        console.error('Error fetching database metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return {
    queryMetrics,
    tableStats,
    loading
  };
};
