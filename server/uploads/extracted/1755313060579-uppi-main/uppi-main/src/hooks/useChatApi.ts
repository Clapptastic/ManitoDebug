
import { useState } from 'react';
import { useSecureOpenAI } from './useSecureOpenAI';

interface ChatMessage {
  message: string;
  enabledProviders?: string[];
}

interface ChatResponse {
  text?: string;
  competitors?: any[];
  error?: string;
}

export function useChatApi() {
  const [error, setError] = useState<string | null>(null);
  const { callChatAPI, isLoading } = useSecureOpenAI();

  const sendMessage = async (chat: ChatMessage): Promise<ChatResponse> => {
    setError(null);

    try {
      // Check if this should be routed to the AI cofounder
      if (chat.message.toLowerCase().includes('cofounder') || 
          chat.message.toLowerCase().includes('business advice') ||
          chat.message.toLowerCase().includes('startup')) {
        
        // Use the cofounder-specific function with enhanced context
        const response = await callChatAPI([
          { role: 'user', content: chat.message }
        ], undefined, undefined, undefined, 'ai_cofounder_assistant');

        if (response?.message) {
          return {
            text: response.message
          };
        }
      }

      // Use the secure OpenAI chat function for all other AI interactions
      const response = await callChatAPI([
        { role: 'user', content: chat.message }
      ], undefined, undefined, undefined);

      if (response?.choices?.[0]?.message?.content) {
        return {
          text: response.choices[0].message.content
        };
      } else {
        throw new Error('No response from AI');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  return {
    sendMessage,
    isLoading,
    error,
  };
}
