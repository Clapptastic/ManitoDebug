-- Fix the competitor_analyses table foreign key constraint
-- Remove the foreign key reference to auth.users which causes RLS issues

-- Drop the existing foreign key constraint
ALTER TABLE public.competitor_analyses DROP CONSTRAINT IF EXISTS competitor_analyses_user_id_fkey;

-- Recreate the user_id column without foreign key constraint
ALTER TABLE public.competitor_analyses 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN user_id SET NOT NULL;