-- Fix chat_settings RLS policies for authenticated users
DROP POLICY IF EXISTS "Service role full access to chat_settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Users can create their own chat settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Users can delete their own chat settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Users can update their own chat settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Users can view their own chat settings" ON public.chat_settings;

-- Create simplified RLS policies for chat_settings
CREATE POLICY "Authenticated users can manage their own chat_settings"
ON public.chat_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access to chat_settings"
ON public.chat_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);