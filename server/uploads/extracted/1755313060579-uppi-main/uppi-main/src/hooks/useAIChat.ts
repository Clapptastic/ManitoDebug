import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, status, created_at, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Load messages for a session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, metadata, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type assertion for role to match our interface
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant' | 'system',
        metadata: msg.metadata as Record<string, any> | undefined
      }));
      
      setMessages(typedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat messages',
        variant: 'destructive',
      });
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    aiProvider: 'openai' | 'anthropic' = 'openai'
  ) => {
    if (!content.trim()) return;

    setIsLoading(true);
    
    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          sessionId: currentSessionId,
          message: content,
          aiProvider,
          context: {}
        }
      });

      if (error) throw error;

      // Update session ID if this was a new session
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        // Reload sessions to show the new one
        loadSessions();
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        metadata: data.metadata,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        // Remove temp user message and add both real messages
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        return [...withoutTemp, userMessage, assistantMessage];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, loadSessions]);

  // Start new session
  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'deleted' })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        startNewSession();
      }

      toast({
        title: 'Success',
        description: 'Chat session deleted',
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  }, [currentSessionId, startNewSession]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => 
        prev.map(s => 
          s.id === sessionId ? { ...s, title } : s
        )
      );
    } catch (error) {
      console.error('Error updating session title:', error);
      toast({
        title: 'Error',
        description: 'Failed to update session title',
        variant: 'destructive',
      });
    }
  }, []);

  return {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isLoadingSessions,
    loadSessions,
    loadMessages,
    sendMessage,
    startNewSession,
    deleteSession,
    updateSessionTitle,
  };
};