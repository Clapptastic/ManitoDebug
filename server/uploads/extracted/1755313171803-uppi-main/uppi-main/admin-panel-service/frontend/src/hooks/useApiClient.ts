import { useState, useEffect } from 'react';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminApiClient {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(config: ApiClientConfig) {
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers.Authorization = `Bearer ${this.apiKey}`;
        }
        
        // Add tenant ID if available
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleUnauthorized() {
    // Clear auth data and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  // Health endpoints
  async getHealth() {
    const response = await this.client.get<ApiResponse>('/health');
    return response.data;
  }

  async getDetailedHealth() {
    const response = await this.client.get<ApiResponse>('/health/detailed');
    return response.data;
  }

  // Authentication endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post<ApiResponse>('/auth/login', credentials);
    return response.data;
  }

  async logout() {
    const response = await this.client.post<ApiResponse>('/auth/logout');
    return response.data;
  }

  async refreshToken() {
    const response = await this.client.post<ApiResponse>('/auth/refresh');
    return response.data;
  }

  // User management endpoints
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const response = await this.client.get<ApiResponse>('/admin/users', { params });
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.client.post<ApiResponse>('/admin/users', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const response = await this.client.put<ApiResponse>(`/admin/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete<ApiResponse>(`/admin/users/${userId}`);
    return response.data;
  }

  // System analytics endpoints
  async getAnalytics(timeRange?: string) {
    const response = await this.client.get<ApiResponse>('/admin/analytics', {
      params: { timeRange }
    });
    return response.data;
  }

  async getUsageMetrics() {
    const response = await this.client.get<ApiResponse>('/admin/analytics/usage');
    return response.data;
  }

  async getPerformanceMetrics() {
    const response = await this.client.get<ApiResponse>('/admin/analytics/performance');
    return response.data;
  }

  // API management endpoints
  async getApiKeys() {
    const response = await this.client.get<ApiResponse>('/admin/api-keys');
    return response.data;
  }

  async createApiKey(data: { name: string; permissions: string[] }) {
    const response = await this.client.post<ApiResponse>('/admin/api-keys', data);
    return response.data;
  }

  async deleteApiKey(keyId: string) {
    const response = await this.client.delete<ApiResponse>(`/admin/api-keys/${keyId}`);
    return response.data;
  }

  async getApiMetrics() {
    const response = await this.client.get<ApiResponse>('/admin/api-metrics');
    return response.data;
  }

  // Error logs endpoints
  async getErrorLogs(params?: { page?: number; limit?: number; severity?: string }) {
    const response = await this.client.get<ApiResponse>('/admin/error-logs', { params });
    return response.data;
  }

  async resolveError(errorId: string, resolution?: string) {
    const response = await this.client.put<ApiResponse>(`/admin/error-logs/${errorId}/resolve`, {
      resolution
    });
    return response.data;
  }

  // Type coverage endpoints
  async getTypeCoverage() {
    const response = await this.client.get<ApiResponse>('/admin/type-coverage');
    return response.data;
  }

  async runTypeAnalysis() {
    const response = await this.client.post<ApiResponse>('/admin/type-coverage/analyze');
    return response.data;
  }

  async fixTypeIssues(filePath: string) {
    const response = await this.client.post<ApiResponse>('/admin/type-coverage/fix', {
      filePath
    });
    return response.data;
  }

  // Package management endpoints
  async getPackages() {
    const response = await this.client.get<ApiResponse>('/admin/packages');
    return response.data;
  }

  async updatePackages(packages: string[]) {
    const response = await this.client.post<ApiResponse>('/admin/packages/update', {
      packages
    });
    return response.data;
  }

  async getDependencies() {
    const response = await this.client.get<ApiResponse>('/admin/packages/dependencies');
    return response.data;
  }

  // Database management endpoints
  async getDatabaseSchema() {
    const response = await this.client.get<ApiResponse>('/admin/database/schema');
    return response.data;
  }

  async getDatabaseTables() {
    const response = await this.client.get<ApiResponse>('/admin/database/tables');
    return response.data;
  }

  async executeQuery(query: string) {
    const response = await this.client.post<ApiResponse>('/admin/database/query', {
      query
    });
    return response.data;
  }

  async getDatabasePerformance() {
    const response = await this.client.get<ApiResponse>('/admin/database/performance');
    return response.data;
  }

  // Webhook management
  async getWebhooks() {
    const response = await this.client.get<ApiResponse>('/admin/webhooks');
    return response.data;
  }

  async createWebhook(data: { url: string; events: string[]; secret?: string }) {
    const response = await this.client.post<ApiResponse>('/admin/webhooks', data);
    return response.data;
  }

  async updateWebhook(webhookId: string, data: any) {
    const response = await this.client.put<ApiResponse>(`/admin/webhooks/${webhookId}`, data);
    return response.data;
  }

  async deleteWebhook(webhookId: string) {
    const response = await this.client.delete<ApiResponse>(`/admin/webhooks/${webhookId}`);
    return response.data;
  }
}

export function useApiClient() {
  const [client, setClient] = useState<AdminApiClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const apiKey = localStorage.getItem('adminApiKey');

    try {
      const apiClient = new AdminApiClient({
        baseURL: apiUrl,
        apiKey: apiKey || undefined,
        timeout: 10000,
      });

      setClient(apiClient);
      
      // Test connection
      apiClient.getHealth()
        .then(() => {
          setIsConnected(true);
          setError(null);
        })
        .catch((err) => {
          setIsConnected(false);
          setError(err.message);
        });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize API client');
    }
  }, []);

  return {
    client,
    isConnected,
    error,
  };
}

export default AdminApiClient;