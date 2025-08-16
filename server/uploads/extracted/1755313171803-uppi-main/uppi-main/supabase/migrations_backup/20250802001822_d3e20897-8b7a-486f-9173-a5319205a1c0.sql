-- Fix RLS policies for competitor_group_entries
DROP POLICY IF EXISTS "Users can manage their own competitor group entries" ON public.competitor_group_entries;
DROP POLICY IF EXISTS "Users can view their own competitor group entries" ON public.competitor_group_entries;

CREATE POLICY "Users can manage their own competitor group entries"
ON public.competitor_group_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.competitor_groups cg 
    WHERE cg.id = competitor_group_entries.group_id 
    AND cg.user_id = auth.uid()
  )
);

-- Fix RLS policies for competitor_groups  
DROP POLICY IF EXISTS "Users can manage their own competitor groups" ON public.competitor_groups;
DROP POLICY IF EXISTS "Users can view their own competitor groups" ON public.competitor_groups;

CREATE POLICY "Users can manage their own competitor groups"
ON public.competitor_groups
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for code_embeddings
DROP POLICY IF EXISTS "Users can manage their own code embeddings" ON public.code_embeddings;
DROP POLICY IF EXISTS "Users can view their own code embeddings" ON public.code_embeddings;

CREATE POLICY "Users can manage their own code embeddings"
ON public.code_embeddings
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for embeddings_status
DROP POLICY IF EXISTS "Users can manage their own embeddings status" ON public.embeddings_status;
DROP POLICY IF EXISTS "Users can view their own embeddings status" ON public.embeddings_status;

CREATE POLICY "Users can manage their own embeddings status"
ON public.embeddings_status
FOR ALL
USING (auth.uid() = user_id);

-- Fix RLS policies for documents
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;

CREATE POLICY "Users can manage their own documents"
ON public.documents
FOR ALL
USING (auth.uid() = user_id);

-- Create chat_sessions table for chat history
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_archived boolean DEFAULT false
);

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for chat_sessions
CREATE POLICY "Users can manage their own chat sessions"
ON public.chat_sessions
FOR ALL
USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for chat_messages
CREATE POLICY "Users can manage their own chat messages"
ON public.chat_messages
FOR ALL
USING (auth.uid() = user_id);

-- Add updated_at trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_group_entries_group_id ON public.competitor_group_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_user_id ON public.code_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_status_user_id ON public.embeddings_status(user_id);