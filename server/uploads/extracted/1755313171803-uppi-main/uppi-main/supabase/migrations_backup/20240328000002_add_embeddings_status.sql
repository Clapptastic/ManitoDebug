
create table if not exists public.embeddings_status (
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
alter table public.embeddings_status enable row level security;

create policy "Users can view their own embeddings status"
    on public.embeddings_status for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can update their own embeddings status"
    on public.embeddings_status for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can create embeddings status"
    on public.embeddings_status for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Add trigger for updated_at
create trigger update_embeddings_status_updated_at
    before update on public.embeddings_status
    for each row
    execute function update_updated_at_column();
