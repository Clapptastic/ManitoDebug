-- Enable realtime for competitor_analysis_progress and ensure idempotency
DO $$
BEGIN
  -- Ensure full row data is published for updates
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'competitor_analysis_progress'
  ) THEN
    EXECUTE 'ALTER TABLE public.competitor_analysis_progress REPLICA IDENTITY FULL';
  END IF;

  -- Add table to supabase_realtime publication if not already included
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'competitor_analysis_progress'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.competitor_analysis_progress';
  END IF;
END $$;