import { supabase } from '@/integrations/supabase/client';
import { unifiedApiKeyService } from '@/services/api-keys/unifiedApiKeyService';

export interface ChatbotConfig {
  provider: string;
  model: string;
  fallbackProviders: string[];
}

class ChatbotConfigService {
  /**
   * Get the current user's chatbot configuration
   */
  async getChatbotConfig(): Promise<ChatbotConfig | null> {
    try {
      const { data, error } = await supabase
        .from('user_chatbot_configs')
        .select('assigned_provider, assigned_model, fallback_providers')
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        provider: data.assigned_provider,
        model: data.assigned_model,
        fallbackProviders: data.fallback_providers || []
      };
    } catch (error: any) {
      console.error('Error fetching chatbot config:', error);
      return null;
    }
  }

  /**
   * Get the API key for the assigned chatbot provider
   */
  async getChatbotApiKey(): Promise<string | null> {
    try {
      const config = await this.getChatbotConfig();
      if (!config) {
        console.log('No chatbot configuration found');
        return null;
      }

      console.log(`🤖 Getting API key for chatbot provider: ${config.provider}`);
      const apiKeyData = await unifiedApiKeyService.getApiKey(config.provider as any);
      const apiKey = apiKeyData?.api_key || null;
      
      if (!apiKey) {
        console.log(`❌ No API key found for ${config.provider}`);
        return null;
      }

      console.log(`✅ Retrieved API key for ${config.provider}`);
      return apiKey;
    } catch (error: any) {
      console.error('Error getting chatbot API key:', error);
      return null;
    }
  }

  /**
   * Get the complete chatbot configuration with API key
   */
  async getActiveChatbotConfig(): Promise<{
    config: ChatbotConfig;
    apiKey: string;
  } | null> {
    try {
      const config = await this.getChatbotConfig();
      if (!config) return null;

      const apiKey = await this.getChatbotApiKey();
      if (!apiKey) return null;

      return { config, apiKey };
    } catch (error: any) {
      console.error('Error getting active chatbot config:', error);
      return null;
    }
  }

  /**
   * Save or update chatbot configuration
   */
  async saveChatbotConfig(config: ChatbotConfig): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_chatbot_configs')
        .upsert({
          user_id: user.user.id,
          assigned_provider: config.provider,
          assigned_model: config.model,
          fallback_providers: config.fallbackProviders,
          configuration: {}
        });

      if (error) throw error;

      console.log(`✅ Chatbot config saved: ${config.provider} ${config.model}`);
      return true;
    } catch (error: any) {
      console.error('Error saving chatbot config:', error);
      return false;
    }
  }
}

export const chatbotConfigService = new ChatbotConfigService();