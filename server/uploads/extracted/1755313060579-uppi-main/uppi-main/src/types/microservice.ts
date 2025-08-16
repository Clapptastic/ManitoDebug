// Microservice types

export interface Microservice {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  port: number;
  url: string;
  version: string;
  healthCheck: string;
  dependencies: string[];
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  lastDeployed: string;
  uptime: number;
  requestCount: number;
  errorRate: number;
}

export interface ServiceLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  metadata?: Record<string, any>;
}

export interface ServiceMetrics {
  serviceId: string;
  timestamp: string;
  requestCount: number;
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface ServiceHealth {
  serviceId: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: string;
  uptime: number;
  version: string;
  dependencies: {
    name: string;
    status: 'healthy' | 'unhealthy';
  }[];
}

export interface MicroserviceEndpoint {
  id: string;
  serviceId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  isPublic: boolean;
  rateLimit?: number;
}