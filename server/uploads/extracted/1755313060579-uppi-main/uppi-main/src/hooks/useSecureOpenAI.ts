
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { chatbotConfigService } from "@/services/chatbotConfigService";
import { contextAwareService } from "@/services/contextAwareService";

interface UseSecureOpenAIOptions {
  onError?: (error: unknown) => void;
  onMissingKey?: () => void;
}

export const useSecureOpenAI = (options?: UseSecureOpenAIOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Securely call OpenAI via Supabase Edge Function, with optional system prompt fetched via prompt-get.
   * @param messages Chat messages
   * @param model Model override
   * @param temperature Sampling temperature
   * @param maxTokens Max tokens
   * @param promptKey Optional prompt key to fetch with prompt-get and prepend as system message
   */
  const callChatAPI = async (
    messages: Array<{ role: string; content: string }>,
    model?: string,
    temperature = 0.7,
    maxTokens = 1500,
    promptKey?: string
  ) => {
    setIsLoading(true);
    try {
      // Get the user's configured chatbot settings
      const chatbotConfig = await chatbotConfigService.getActiveChatbotConfig();
      
      if (!chatbotConfig) {
        console.log("❌ No active chatbot configuration found");
        toast({
          title: "Configuration Required",
          description: "Please configure your AI chatbot in the API Keys settings",
          variant: "destructive",
        });
        return null;
      }

      // Use configured model if not explicitly provided
      const selectedModel = model || chatbotConfig.config.model;
      console.log(`🤖 Using chatbot config: ${chatbotConfig.config.provider} ${selectedModel}`);
      
      // Optionally fetch system prompt and prepend to messages
      let finalMessages = messages;
      if (promptKey) {
        try {
          const promptSvc = await import('@/services/promptService');
          const prompt = await promptSvc.getPromptByKey(promptKey);
          if (prompt?.content) {
            finalMessages = [
              { role: 'system', content: String(prompt.content) },
              ...messages,
            ];
          }
        } catch (e) {
          console.warn('[useSecureOpenAI] Failed to load prompt via prompt-get:', e);
        }
      }

      // Enhanced context is built in the edge function
      console.log('🤖 Sending message with context integration...');

      // If using the cofounder assistant, route to specialized function
      if (promptKey === 'ai_cofounder_assistant') {
        const lastUserMsg = [...finalMessages].reverse().find(m => m.role === 'user')?.content || '';
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) {
          throw new Error('Authentication required for cofounder assistant');
        }
        const { data, error } = await supabase.functions.invoke('ai-cofounder-chat', {
          body: {
            message: lastUserMsg,
            userId
          }
        });
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase.functions.invoke("secure-openai-chat", {
        body: {
          messages: finalMessages,
          model: selectedModel,
          temperature,
          max_tokens: maxTokens,
          provider: chatbotConfig.config.provider
        }
      });

      if (error) {
        console.error("Error calling OpenAI:", error);
        if (options?.onError) {
          options.onError(error);
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to process request",
            variant: "destructive",
          });
        }
        return null;
      }

      console.log("OpenAI response received:", data);
      // Best-effort usage logging so Admin > Prompts shows non-zero usage even if cost inserts fail elsewhere
      try {
        await supabase.functions.invoke('api-cost-tracker', {
          body: {
            provider: chatbotConfig.config.provider,
            service: 'chat',
            endpoint: 'chat.completions',
            usage_count: 1,
            tokens_used: 0,
            cost_usd: 0,
            model: selectedModel,
            success: true
          }
        });
      } catch (e) {
        console.warn('[useSecureOpenAI] api-cost-tracker logging failed:', e);
      }
      return data;
    } catch (error: unknown) {
      console.error("Error in OpenAI request:", error);
      
      if (error instanceof Error && 
          (error.message?.includes("API key not found") || 
           'code' in error && error.code === "INVALID_API_KEY")) {
        if (options?.onMissingKey) {
          options.onMissingKey();
        } else {
          toast({
            title: "Configuration Required",
            description: "Please configure your AI chatbot settings in the API Keys page",
            variant: "destructive",
          });
        }
      } else if (options?.onError) {
        options.onError(error);
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process request",
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    callChatAPI,
    isLoading
  };
};
