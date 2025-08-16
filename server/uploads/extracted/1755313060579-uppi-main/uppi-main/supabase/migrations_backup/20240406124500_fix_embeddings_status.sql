
-- Check if embeddings_status table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'embeddings_status'
  ) THEN
    CREATE TABLE public.embeddings_status (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) not null,
      total_embeddings integer default 0,
      tokens_used integer default 0,
      status text default 'inactive',
      last_check timestamp with time zone default now(),
      last_successful_push timestamp with time zone,
      last_push_attempt timestamp with time zone,
      is_pushing boolean default false,
      error_message text,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      api_key_id uuid references api_keys(id),
      using_default_key boolean default true,
      api_key_source text default 'personal'
    );

    -- Add RLS policies
    ALTER TABLE public.embeddings_status ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own embeddings status"
      ON public.embeddings_status FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own embeddings status"
      ON public.embeddings_status FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can create embeddings status"
      ON public.embeddings_status FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    -- Add trigger for updated_at
    CREATE TRIGGER update_embeddings_status_updated_at
      BEFORE UPDATE ON public.embeddings_status
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Ensure the update_updated_at_column function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END
$$;
