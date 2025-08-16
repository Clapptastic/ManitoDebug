import { supabase } from "@/integrations/supabase/client";
import { ApiProviderStatusInfo, ApiKeyType } from "@/types/api-keys/unified";

export interface ApiKeyStatusResponse {
  isValid: boolean;
  isWorking: boolean;
  status: string;
  errorMessage?: string;
  exists: boolean;
  lastChecked: string | null;
}

/**
 * Service for validating and managing API keys
 */
export class ApiKeyValidationService {
  /**
   * Validates a particular API key type using the validate-api-key edge function
   * @param apiType The type of API key to validate
   * @returns Status of the validation process
   */
  static async validateApiKey(apiType: string): Promise<ApiKeyStatusResponse> {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Authentication failed");
      }

      if (!sessionData?.session?.access_token) {
        console.error("No valid session or access token");
        throw new Error("No valid authentication session");
      }

      console.log(`🔍 Validating API key for type: ${apiType}`);

      // Call the validate-api-key edge function
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { apiType },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error(`❌ Error validating ${apiType} API key:`, error);
        return {
          isValid: false,
          isWorking: false,
          status: "error",
          errorMessage: error.message || "Validation failed",
          exists: false,
          lastChecked: new Date().toISOString()
        };
      }

      console.log(`✅ Validation response for ${apiType}:`, data);

      return {
        isValid: data?.isValid || false,
        isWorking: data?.isWorking || false,
        status: data?.status || "unknown",
        errorMessage: data?.errorMessage || null,
        exists: data?.exists || false,
        lastChecked: data?.lastChecked || new Date().toISOString()
      };
    } catch (error) {
      console.error("Exception during API key validation:", error);
      return {
        isValid: false,
        isWorking: false,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "An unexpected error occurred",
        exists: true,
        lastChecked: null
      };
    }
  }

  /**
   * Gets the current status of all API keys for the user using the check-api-keys edge function
   */
  static async getApiKeyStatuses(): Promise<Record<string, ApiKeyStatusResponse>> {
    try {
      // Get current session with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        // Return default error statuses instead of throwing
        return ApiKeyValidationService.getDefaultErrorStatuses(sessionError.message);
      }

      if (!sessionData?.session?.access_token) {
        console.error("No valid session or access token");
        // Return default error statuses instead of throwing
        return ApiKeyValidationService.getDefaultErrorStatuses("No authentication session");
      }

      console.log("🔑 Session data available, making edge function call...");

      // Call the edge function with proper authorization
      const { data, error } = await supabase.functions.invoke('check-api-keys', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error("❌ Error calling check-api-keys function:", error);
        // Return default error statuses instead of throwing
        return ApiKeyValidationService.getDefaultErrorStatuses(error.message || "Edge Function error");
      }

      if (!data) {
        console.error("❌ No data returned from check-api-keys function");
        return ApiKeyValidationService.getDefaultErrorStatuses("No data returned from function");
      }

      console.log("✅ Raw API status data received:", data);

      // Transform the response to match our expected format
      const transformedStatuses: Record<string, ApiKeyStatusResponse> = {};
      
      if (data.apiKeys && typeof data.apiKeys === 'object') {
        Object.entries(data.apiKeys).forEach(([provider, status]: [string, any]) => {
          transformedStatuses[provider] = {
            isValid: status.isWorking || false,
            isWorking: status.isWorking || false,
            status: status.status || 'unknown',
            errorMessage: status.errorMessage || null,
            exists: status.exists || false,
            lastChecked: status.lastChecked || new Date().toISOString()
          };
        });
      }

      console.log("📊 Transformed API status result:", transformedStatuses);
      return transformedStatuses;

    } catch (error) {
      console.error("❌ Error getting API key status:", error);
      return ApiKeyValidationService.getDefaultErrorStatuses(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }

  /**
   * Helper method to return default error statuses for all known providers
   */
  private static getDefaultErrorStatuses(errorMessage: string): Record<string, ApiKeyStatusResponse> {
    const providers = ['openai', 'anthropic', 'gemini', 'perplexity', 'mistral', 'serpapi'];
    const defaultStatuses: Record<string, ApiKeyStatusResponse> = {};
    
    providers.forEach(provider => {
      defaultStatuses[provider] = {
        isValid: false,
        isWorking: false,
        status: "error",
        errorMessage: errorMessage,
        exists: false,
        lastChecked: null
      };
    });
    
    return defaultStatuses;
  }

  /**
   * Maps our internal ApiKeyStatusResponse to the format expected by competitor analysis
   */
  static mapToProviderStatus(response: ApiKeyStatusResponse, provider: string): ApiProviderStatusInfo {
    return {
      provider: provider as ApiKeyType,
      name: provider,
      status: response.status as any,
      isWorking: response.isWorking,
      exists: response.exists,
      lastChecked: response.lastChecked,
      errorMessage: response.errorMessage,
      isActive: response.isValid,
      isConfigured: response.exists
    };
  }

  /**
   * Converts a record of ApiKeyStatusResponse to ApiProviderStatusInfo format
   */
  static mapToProviderStatuses(statuses: Record<string, ApiKeyStatusResponse>): Record<string, ApiProviderStatusInfo> {
    const mapped: Record<string, ApiProviderStatusInfo> = {};
    
    Object.entries(statuses).forEach(([provider, status]) => {
      mapped[provider] = ApiKeyValidationService.mapToProviderStatus(status, provider);
    });
    
    return mapped;
  }
}