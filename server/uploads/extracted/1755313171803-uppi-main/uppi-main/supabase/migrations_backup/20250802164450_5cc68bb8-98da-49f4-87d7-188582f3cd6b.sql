-- Enable real-time functionality for admin dashboard tables
-- This allows the admin dashboard to receive live updates

-- Enable replica identity for real-time updates
ALTER TABLE public.competitor_analyses REPLICA IDENTITY FULL;
ALTER TABLE public.api_keys REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.system_components REPLICA IDENTITY FULL;
ALTER TABLE public.edge_function_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitor_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.api_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_components;
ALTER PUBLICATION supabase_realtime ADD TABLE public.edge_function_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;