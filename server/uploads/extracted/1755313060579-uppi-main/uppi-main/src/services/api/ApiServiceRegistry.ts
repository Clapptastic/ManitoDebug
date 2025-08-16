
import { PerplexityApiService } from "./competitor/PerplexityApiService";

class ApiServiceRegistry {
  private static instance: ApiServiceRegistry;
  private services: Map<string, unknown> = new Map();

  private constructor() {
    this.services.set('perplexity', new PerplexityApiService());
  }

  static getInstance(): ApiServiceRegistry {
    if (!ApiServiceRegistry.instance) {
      ApiServiceRegistry.instance = new ApiServiceRegistry();
    }
    return ApiServiceRegistry.instance;
  }

  getService<T>(provider: string): T {
    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`API service for provider ${provider} not found`);
    }
    return service as T;
  }
}

export const apiRegistry = ApiServiceRegistry.getInstance();
