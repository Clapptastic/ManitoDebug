-- Enable real-time for critical tables
ALTER TABLE public.competitor_analyses REPLICA IDENTITY FULL;
ALTER TABLE public.api_keys REPLICA IDENTITY FULL;
ALTER TABLE public.system_components REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  competitor_analyses,
  api_keys,
  system_components,
  profiles,
  chat_sessions,
  documents;