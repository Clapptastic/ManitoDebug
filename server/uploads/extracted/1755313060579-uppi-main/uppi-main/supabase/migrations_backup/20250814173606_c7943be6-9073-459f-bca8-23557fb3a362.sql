-- Fix error_events table RLS policies to allow proper edge function access

-- Drop duplicate and problematic policies
DROP POLICY IF EXISTS "Users can insert own error events" ON public.error_events;
DROP POLICY IF EXISTS "Users can insert their own error events" ON public.error_events;
DROP POLICY IF EXISTS "Users can read own error events" ON public.error_events;
DROP POLICY IF EXISTS "Users can view their own error events" ON public.error_events;

-- Create correct policies

-- Allow authenticated users to view their own error events
CREATE POLICY "Users can view their own error events"
ON public.error_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert error events (for both their own and anonymous errors)
CREATE POLICY "Users can insert error events"
ON public.error_events
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Allow service role full access (for edge functions)
-- This policy already exists: "Service role full access - error_events"

-- Allow admins to read all error events  
-- This policy already exists: "Admins can read all error events"

-- Allow admins to delete error events
-- This policy already exists: "Admins can delete error events"