-- Fix cron unschedule with exception guard, then schedule
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('invoke-bulk-consolidate-companies-nightly');
  EXCEPTION WHEN OTHERS THEN
    -- ignore if job does not exist
    NULL;
  END;
END$$;

SELECT cron.schedule(
  'invoke-bulk-consolidate-companies-nightly',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://jqbdjttdaihidoyalqvs.functions.supabase.co/bulk-consolidate-companies',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);