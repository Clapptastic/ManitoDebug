-- Enable real-time for competitor analysis progress table
ALTER TABLE public.competitor_analysis_progress REPLICA IDENTITY FULL;

-- Add the table to realtime publication (this will be automatically handled by Supabase)
-- The realtime functionality will be automatically available for this table