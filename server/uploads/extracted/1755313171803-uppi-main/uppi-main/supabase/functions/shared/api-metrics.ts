/**
 * API Metrics Logging for Edge Functions
 * Provides standardized logging for API usage tracking
 */

interface ApiMetricsLog {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  provider?: string;
  cost?: number;
  tokensUsed?: number;
}

/**
 * Log API metrics for tracking and analytics
 */
export function logApiMetrics(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  options: {
    userId?: string;
    provider?: string;
    cost?: number;
    tokensUsed?: number;
  } = {}
) {
  const metrics: ApiMetricsLog = {
    endpoint,
    method,
    statusCode,
    responseTime,
    ...options
  };

  console.log('[API_METRICS]', JSON.stringify(metrics));
}