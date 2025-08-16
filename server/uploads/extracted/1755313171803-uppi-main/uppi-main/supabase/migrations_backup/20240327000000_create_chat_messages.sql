
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own messages
CREATE POLICY "Users can view their own messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX chat_messages_user_id_idx ON public.chat_messages(user_id);
CREATE INDEX chat_messages_created_at_idx ON public.chat_messages(created_at);

-- Add updated_at trigger
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
