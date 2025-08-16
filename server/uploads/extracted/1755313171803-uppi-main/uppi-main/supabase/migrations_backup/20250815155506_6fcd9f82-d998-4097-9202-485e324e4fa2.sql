-- Fix RLS policy for log-error-event edge function
-- The service role should be able to insert error events without restrictions

-- Drop the existing service role policy that might be restrictive
DROP POLICY IF EXISTS "Service role full access - error_events" ON public.error_events;

-- Create a new comprehensive service role policy for error_events
CREATE POLICY "Service role can manage error events"
ON public.error_events
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Also ensure the authenticated role can insert error events properly
DROP POLICY IF EXISTS "Users can insert error events" ON public.error_events;

CREATE POLICY "Authenticated users can insert error events"
ON public.error_events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow any authenticated user to insert error events
  -- user_id can be null (for anonymous errors) or must match auth.uid()
  (user_id IS NULL OR user_id = auth.uid())
);

-- Grant explicit permissions to the service role
GRANT ALL ON public.error_events TO service_role;

-- Grant permissions for the sequence if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name LIKE '%error_events%') THEN
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
  END IF;
END $$;