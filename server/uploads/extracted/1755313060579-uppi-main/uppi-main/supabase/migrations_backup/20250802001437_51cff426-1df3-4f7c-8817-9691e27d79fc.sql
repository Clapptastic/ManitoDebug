-- Fix critical RLS and database issues

-- 1. Create missing profiles trigger for new users (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix missing insert policies for competitor_group_entries
CREATE POLICY "Users can insert their own competitor group entries" 
ON public.competitor_group_entries FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM competitor_groups cg 
  WHERE cg.id = competitor_group_entries.group_id 
  AND cg.user_id = auth.uid()
));

-- 3. Fix missing insert/update policies for competitor_groups
CREATE POLICY "Users can insert their own competitor groups" 
ON public.competitor_groups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor groups" 
ON public.competitor_groups FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Fix missing insert/update policies for code_embeddings
CREATE POLICY "Users can insert their own code embeddings" 
ON public.code_embeddings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own code embeddings" 
ON public.code_embeddings FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Fix missing insert/update policies for embeddings_status
CREATE POLICY "Users can insert their own embeddings status" 
ON public.embeddings_status FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings status" 
ON public.embeddings_status FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Fix missing insert/update policies for documents
CREATE POLICY "Users can insert their own documents" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents FOR UPDATE 
USING (auth.uid() = user_id);

-- 7. Create missing chat_sessions table for chat history
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can manage their own chat sessions" 
ON public.chat_sessions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY "Users can manage their own chat messages" 
ON public.chat_messages FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions cs 
  WHERE cs.id = chat_messages.session_id 
  AND cs.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_sessions cs 
  WHERE cs.id = chat_messages.session_id 
  AND cs.user_id = auth.uid()
));

-- 9. Create triggers for updated_at timestamps
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);