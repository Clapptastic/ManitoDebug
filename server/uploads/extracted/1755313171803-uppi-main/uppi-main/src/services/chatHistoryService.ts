import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  status: 'active' | 'archived';
  context?: any;
  metadata?: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

class ChatHistoryService {
  async createChatSession(title?: string): Promise<string> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          status: 'active',
          user_id: session.session.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  async saveChatSession(messages: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>[]): Promise<string> {
    try {
      const sessionId = await this.createChatSession();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('chat_messages')
        .insert(
          messages.map(msg => ({
            session_id: sessionId,
            user_id: session.session.user.id,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata || {}
          }))
        );

      if (error) throw error;
      return sessionId;
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw error;
    }
  }

  async updateChatSession(sessionId: string, messages: any[]): Promise<boolean> {
    try {
      // Simple implementation - just update timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return true;
    } catch (error) {
      console.error('Error updating chat session:', error);
      return false;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();