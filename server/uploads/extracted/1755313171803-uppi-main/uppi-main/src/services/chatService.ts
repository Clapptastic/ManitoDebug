import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    provider?: string;
    model?: string;
    tokens_used?: number;
    cost?: number;
    context_used?: string[];
    confidence_score?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  context?: {
    business_data?: any;
    competitor_analyses?: any[];
    documents?: any[];
    preferences?: {
      ai_provider: string;
      model: string;
      temperature: number;
      max_tokens: number;
    };
  };
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  user_profile?: any;
  company_profile?: any;
  competitor_analyses?: any[];
  business_plans?: any[];
  documents?: any[];
  api_usage?: any;
}

class ChatService {
  /**
   * Create a new chat session
   */
  async createSession(title?: string, context?: any): Promise<ChatSession> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: authUser.user.id,
        title: title || `Chat ${new Date().toLocaleString()}`,
        status: 'active',
        context: context || {},
        metadata: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatSession;
  }

  /**
   * Get all chat sessions for the current user
   */
  async getSessions(): Promise<ChatSession[]> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', authUser.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ChatSession[];
  }

  /**
   * Get messages for a specific session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ChatMessage[];
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    sessionId: string,
    content: string,
    provider: 'openai' | 'anthropic' = 'openai',
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      include_context?: boolean;
    }
  ): Promise<ChatMessage> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    // Add user message to database
    const { data: userMessage, error: userError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: authUser.user.id,
        role: 'user',
        content,
        metadata: { provider }
      })
      .select()
      .single();

    if (userError) throw userError;

    try {
      // Get business context if requested
      let businessContext = null;
      if (options?.include_context !== false) {
        businessContext = await this.getBusinessContext();
      }

      // Call AI chat edge function
      // Load system prompt via prompt-get (non-blocking fallback)
      let systemPrompt: string | undefined = undefined;
      try {
        const defaultPromptKey = 'ai_cofounder_assistant';
        const prompt = await (await import('@/services/promptService')).getPromptByKey(defaultPromptKey);
        systemPrompt = prompt?.content ?? undefined;
      } catch (e) {
        console.warn('Failed to fetch system prompt; proceeding with default in edge function.', e);
      }

      // Preflight: ensure user has an active API key for the selected provider to avoid 400 from edge function
      // RLS restricts to the current user's keys only; selecting id is safe and minimal
      const { data: keyCheck } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', authUser.user.id)
        .ilike('provider', (provider || 'openai').toLowerCase())
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (!keyCheck) {
        throw new Error('missing_api_key');
      }

      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-chat', {
        body: {
          sessionId,
          message: content,
          provider: (provider || 'openai').toLowerCase() as 'openai' | 'anthropic',
          model: options?.model,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
          context: businessContext,
          systemPrompt
        }
      });

      if (aiError) throw aiError;

      // Add AI response to database
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: authUser.user.id,
          role: 'assistant',
          content: aiResponse.content,
          metadata: {
            provider,
            model: aiResponse.model,
            tokens_used: aiResponse.tokens_used,
            cost: aiResponse.cost,
            context_used: aiResponse.context_used,
            confidence_score: aiResponse.confidence_score
          }
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return assistantMessage as ChatMessage;
    } catch (error: unknown) {
      console.error('AI Chat error:', error);

      // Determine a user-friendly error message
      const rawMsg = error instanceof Error ? error.message : String(error);
      const isInvalidKey = /invalid_api_key|401/.test(rawMsg || '');
      const isMissingKey = /missing_api_key|not found for this user/i.test(rawMsg || '');
      const friendly = isMissingKey
        ? 'No active API key found for your selected AI provider. Please add one in Settings > API Keys and try again.'
        : isInvalidKey
        ? 'Your AI provider API key seems invalid. Please update it in Settings > API Keys and try again.'
        : 'I apologize, but I encountered an error while processing your message. Please try again.';

      // Notify user via toast
      try {
        toast({
          title: isMissingKey ? 'API Key Required' : isInvalidKey ? 'Invalid API Key' : 'Chat Error',
          description: friendly,
          variant: 'destructive',
        });
      } catch {}

      // Store an assistant error message for traceability
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: authUser.user.id,
          role: 'assistant',
          content: friendly,
          metadata: { error: rawMsg }
        });

      throw error;
    }
  }

  /**
   * Update session title
   */
  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', authUser.user.id)
      .select()
      .single();

    if (error) throw error;
    return data as ChatSession;
  }

  /**
   * Delete a chat session and all its messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    // Delete messages first (cascade should handle this, but being explicit)
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    // Delete session
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', authUser.user.id);

    if (error) throw error;
  }

  /**
   * Get business context for AI chat
   */
  async getBusinessContext(): Promise<ChatContext> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get company profile
      const { data: company } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', authUser.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get recent competitor analyses
      const { data: analyses } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('user_id', authUser.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get business plans
      const { data: plans } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', authUser.user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Get recent documents
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', authUser.user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      return {
        user_profile: profile,
        company_profile: company,
        competitor_analyses: analyses || [],
        business_plans: plans || [],
        documents: documents || []
      };
    } catch (error) {
      console.error('Error getting business context:', error);
      return {};
    }
  }

  /**
   * Archive a chat session
   */
  async archiveSession(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, { status: 'archived' });
  }

  /**
   * Get chat usage statistics
   */
  async getChatUsageStats(): Promise<{
    total_messages: number;
    total_sessions: number;
    total_cost: number;
    tokens_used: number;
    avg_session_length: number;
  }> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('Not authenticated');

    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', authUser.user.id);

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('metadata')
      .eq('user_id', authUser.user.id);

    const totalSessions = sessions?.length || 0;
    const totalMessages = messages?.length || 0;
    
    let totalCost = 0;
    let tokensUsed = 0;
    
    messages?.forEach(msg => {
      const metadata = msg.metadata as any;
      if (metadata?.cost) totalCost += metadata.cost;
      if (metadata?.tokens_used) tokensUsed += metadata.tokens_used;
    });

    return {
      total_messages: totalMessages,
      total_sessions: totalSessions,
      total_cost: totalCost,
      tokens_used: tokensUsed,
      avg_session_length: totalSessions > 0 ? totalMessages / totalSessions : 0
    };
  }
}

export const chatService = new ChatService();