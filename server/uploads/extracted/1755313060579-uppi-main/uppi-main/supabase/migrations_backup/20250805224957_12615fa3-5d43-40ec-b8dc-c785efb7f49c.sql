-- Fix trigger issue and ensure proper RLS for chatbot functionality

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;

-- Ensure RLS policies for profiles allow service role access
DROP POLICY IF EXISTS "Service role can access profiles" ON public.profiles;
CREATE POLICY "Service role can access profiles" 
ON public.profiles FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() = id OR auth.uid() = user_id);

-- Ensure RLS policies for company_profiles allow service role access  
DROP POLICY IF EXISTS "Service role can access company profiles" ON public.company_profiles;
CREATE POLICY "Service role can access company profiles" 
ON public.company_profiles FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Ensure RLS policies for competitor_analyses allow service role access
DROP POLICY IF EXISTS "Service role can access competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Service role can access competitor analyses" 
ON public.competitor_analyses FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Ensure RLS policies for documents allow service role access
DROP POLICY IF EXISTS "Service role can access documents" ON public.documents;
CREATE POLICY "Service role can access documents" 
ON public.documents FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Ensure RLS policies for documentation allow service role access
DROP POLICY IF EXISTS "Service role can access documentation" ON public.documentation;
CREATE POLICY "Service role can access documentation" 
ON public.documentation FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Now add the triggers back if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_chat_sessions_updated_at' 
        AND tgrelid = 'public.chat_sessions'::regclass
    ) THEN
        CREATE TRIGGER update_chat_sessions_updated_at
        BEFORE UPDATE ON public.chat_sessions
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_chat_messages_updated_at' 
        AND tgrelid = 'public.chat_messages'::regclass
    ) THEN
        CREATE TRIGGER update_chat_messages_updated_at
        BEFORE UPDATE ON public.chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;