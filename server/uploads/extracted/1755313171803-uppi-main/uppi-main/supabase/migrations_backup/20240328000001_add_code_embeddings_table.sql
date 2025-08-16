
-- Create the code_embeddings table if it doesn't exist
create table if not exists public.code_embeddings (
    id uuid primary key default gen_random_uuid(),
    file_path text not null,
    content text not null,
    embedding vector(1536),
    embedding_model text,
    token_count integer,
    processing_time_ms integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    deleted_at timestamp with time zone,
    user_id uuid references auth.users(id) not null,
    
    constraint valid_file_path check (char_length(file_path) > 0)
);

-- Add RLS policies
alter table public.code_embeddings enable row level security;

create policy "Users can create code embeddings"
    on public.code_embeddings for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can view their own code embeddings"
    on public.code_embeddings for select
    to authenticated
    using (auth.uid() = user_id and deleted_at is null);

create policy "Users can update their own code embeddings"
    on public.code_embeddings for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Add an updated_at trigger
create trigger update_code_embeddings_updated_at
    before update on public.code_embeddings
    for each row
    execute function update_updated_at_column();

-- Create an index for similarity search
create index if not exists code_embeddings_embedding_idx 
    on public.code_embeddings 
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);
