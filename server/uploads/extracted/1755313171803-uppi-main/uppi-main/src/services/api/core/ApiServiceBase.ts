import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export abstract class ApiServiceBase {
  protected abstract apiProvider: string;
  
  // Use api_metrics table for logging
  protected async logRequest(endpoint: string, requestPayload?: any): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const safeMetadata = (() => {
        try { return { provider: this.apiProvider, request: requestPayload ?? null } as Json; } catch { return { provider: this.apiProvider } as Json; }
      })();

      const { data, error } = await supabase
        .from('api_metrics')
        .insert({
          endpoint: `${this.apiProvider}-${endpoint}`,
          method: 'functions.invoke',
          status_code: null,
          response_time_ms: 0,
          user_id: session.user.id,
          metadata: safeMetadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging request:', error);
        return null;
      }

      return (data as any)?.id || null;
    } catch (error) {
      console.error('Error in logRequest:', error);
      return null;
    }
  }

  protected async logResponse(
    logId: string | null,
    success: boolean,
    responseTime: number,
    responsePayload?: any,
    statusCode?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (!logId) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Update the existing log entry
      const { error } = await supabase
        .from('api_metrics')
        .update({
          status_code: statusCode ?? (success ? 200 : 500),
          response_time_ms: responseTime,
          metadata: {
            provider: this.apiProvider,
            success,
            error: errorMessage || null,
          } as Json,
        })
        .eq('id', logId);


      if (error) {
        console.error('Error updating log:', error);
      }
    } catch (error) {
      console.error('Error in logResponse:', error);
    }
  }

  protected async executeApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    requestPayload?: any
  ): Promise<T> {
    const startTime = Date.now();
    const logId = await this.logRequest(endpoint, requestPayload);

    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      await this.logResponse(logId, true, responseTime, result, 200);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logResponse(logId, false, responseTime, null, 500, errorMessage);
      throw error;
    }
  }

  // Abstract methods that derived classes should implement
  protected abstract getApiName(): string;
  protected abstract getBaseUrl(): string;
}