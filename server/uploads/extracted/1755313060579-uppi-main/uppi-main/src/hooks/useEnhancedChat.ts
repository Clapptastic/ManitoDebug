import { useState, useCallback, useEffect } from 'react';
import { chatService, ChatMessage, ChatSession } from '@/services/chatService';
import { toast } from '@/hooks/use-toast';

export const useEnhancedChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat preferences
  const [preferences, setPreferences] = useState({
    provider: 'openai' as 'openai' | 'anthropic',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    include_context: true
  });

  /**
   * Load all chat sessions
   */
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);
    
    try {
      const sessionsData = await chatService.getSessions();
      setSessions(sessionsData);
      
      // Set current session to most recent if none selected
      if (!currentSessionId && sessionsData.length > 0) {
        setCurrentSessionId(sessionsData[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sessions');
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentSessionId]);

  /**
   * Load messages for current session
   */
  const loadMessages = useCallback(async (sessionId?: string) => {
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const messagesData = await chatService.getMessages(targetSessionId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      toast({
        title: 'Error',
        description: 'Failed to load chat messages',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId]);

  /**
   * Create a new chat session
   */
  const createSession = useCallback(async (title?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await chatService.createSession(title, {
        preferences
      });
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      
      toast({
        title: 'New Chat',
        description: 'New chat session created'
      });
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create session');
      toast({
        title: 'Error',
        description: 'Failed to create new chat session',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string) => {
    // Guard: ignore empty messages
    if (!content.trim()) return;

    // Ensure we have a valid session ID before inserting any message to avoid RLS violations
    // Note: setState is async; we capture the ID locally to prevent race conditions with RLS checks
    let sessionIdToUse = currentSessionId;
    if (!sessionIdToUse) {
      const newSession = await createSession();
      if (!newSession) return;
      sessionIdToUse = newSession.id;
      // Keep state in sync (createSession sets it too, but we also set here for safety)
      setCurrentSessionId(sessionIdToUse);
    }

    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately using the resolved sessionId
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionIdToUse,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const assistantMessage = await chatService.sendMessage(
        sessionIdToUse,
        content,
        preferences.provider,
        {
          model: preferences.model,
          temperature: preferences.temperature,
          max_tokens: preferences.max_tokens,
          include_context: preferences.include_context
        }
      );

      // Replace temp user message and add assistant message
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
        return [...withoutTemp, assistantMessage];
      });

      // Refresh messages to get the actual user message from DB
      await loadMessages(sessionIdToUse);

    } catch (error) {
      // Remove temp user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, preferences, createSession, loadMessages]);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      await chatService.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
          await loadMessages(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      
      toast({
        title: 'Session Deleted',
        description: 'Chat session has been deleted'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete session');
      toast({
        title: 'Error',
        description: 'Failed to delete chat session',
        variant: 'destructive'
      });
    }
  }, [currentSessionId, sessions, loadMessages]);

  /**
   * Update session title
   */
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    setError(null);

    try {
      const updatedSession = await chatService.updateSession(sessionId, { title });
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));
      
      toast({
        title: 'Session Updated',
        description: 'Session title has been updated'
      });
    } catch (error) {
      console.error('Error updating session:', error);
      setError(error instanceof Error ? error.message : 'Failed to update session');
      toast({
        title: 'Error',
        description: 'Failed to update session title',
        variant: 'destructive'
      });
    }
  }, []);

  /**
   * Switch to a different session
   */
  const switchSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  }, [loadMessages]);

  /**
   * Update chat preferences
   */
  const updatePreferences = useCallback((newPreferences: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  /**
   * Archive a session
   */
  const archiveSession = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      await chatService.archiveSession(sessionId);
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? { ...session, status: 'archived' } : session
      ));
      
      toast({
        title: 'Session Archived',
        description: 'Chat session has been archived'
      });
    } catch (error) {
      console.error('Error archiving session:', error);
      setError(error instanceof Error ? error.message : 'Failed to archive session');
      toast({
        title: 'Error',
        description: 'Failed to archive session',
        variant: 'destructive'
      });
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []); // Remove loadSessions dependency to prevent infinite loop

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages();
    }
  }, [currentSessionId]); // Remove loadMessages dependency to prevent infinite loop

  return {
    // State
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isLoadingSessions,
    error,
    preferences,

    // Actions
    loadSessions,
    loadMessages,
    createSession,
    sendMessage,
    deleteSession,
    updateSessionTitle,
    switchSession,
    updatePreferences,
    archiveSession,

    // Computed
    currentSession: sessions.find(s => s.id === currentSessionId),
    hasActiveSessions: sessions.filter(s => s.status === 'active').length > 0
  };
};