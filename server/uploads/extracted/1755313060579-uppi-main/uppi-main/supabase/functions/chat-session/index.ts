import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionId, message, title } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Chat session action: ${action}`);

    let result = {};

    switch (action) {
      case 'create_session':
        result = await createChatSession(supabaseClient, user.id, title);
        break;
      case 'get_sessions':
        result = await getChatSessions(supabaseClient, user.id);
        break;
      case 'get_messages':
        if (!sessionId) {
          throw new Error('Session ID is required for get_messages');
        }
        result = await getChatMessages(supabaseClient, user.id, sessionId);
        break;
      case 'add_message':
        if (!sessionId || !message) {
          throw new Error('Session ID and message are required for add_message');
        }
        result = await addChatMessage(supabaseClient, user.id, sessionId, message);
        break;
      case 'update_session_title':
        if (!sessionId || !title) {
          throw new Error('Session ID and title are required for update_session_title');
        }
        result = await updateSessionTitle(supabaseClient, user.id, sessionId, title);
        break;
      case 'archive_session':
        if (!sessionId) {
          throw new Error('Session ID is required for archive_session');
        }
        result = await archiveSession(supabaseClient, user.id, sessionId);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in chat session management:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

async function createChatSession(supabaseClient: any, userId: string, title?: string) {
  const sessionTitle = title || `Chat Session ${new Date().toLocaleDateString()}`;
  
  const { data: session, error } = await supabaseClient
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: sessionTitle
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  console.log(`Created chat session: ${session.id}`);
  return { session };
}

async function getChatSessions(supabaseClient: any, userId: string) {
  const { data: sessions, error } = await supabaseClient
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch chat sessions: ${error.message}`);
  }

  return { sessions };
}

async function getChatMessages(supabaseClient: any, userId: string, sessionId: string) {
  // Verify session ownership
  const { data: session, error: sessionError } = await supabaseClient
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found or access denied');
  }

  const { data: messages, error } = await supabaseClient
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chat messages: ${error.message}`);
  }

  return { messages };
}

async function addChatMessage(supabaseClient: any, userId: string, sessionId: string, message: any) {
  // Verify session ownership
  const { data: session, error: sessionError } = await supabaseClient
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found or access denied');
  }

  const { data: newMessage, error } = await supabaseClient
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role: message.role,
      content: message.content,
      metadata: message.metadata || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add chat message: ${error.message}`);
  }

  // Update session's updated_at timestamp
  await supabaseClient
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  console.log(`Added message to session ${sessionId}`);
  return { message: newMessage };
}

async function updateSessionTitle(supabaseClient: any, userId: string, sessionId: string, title: string) {
  const { data: session, error } = await supabaseClient
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session title: ${error.message}`);
  }

  return { session };
}

async function archiveSession(supabaseClient: any, userId: string, sessionId: string) {
  const { data: session, error } = await supabaseClient
    .from('chat_sessions')
    .update({ is_archived: true })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive session: ${error.message}`);
  }

  return { session };
}