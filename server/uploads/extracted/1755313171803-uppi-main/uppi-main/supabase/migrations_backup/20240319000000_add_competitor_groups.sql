
create type competitor_group_status as enum ('draft', 'active', 'archived');

-- Create the competitor_groups table
create table competitor_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  status competitor_group_status default 'draft',
  notes jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create the competitor_group_entries table
create table competitor_group_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references competitor_groups(id),
  competitor_analysis_id uuid not null references competitor_analyses(id),
  similar_competitor_id uuid references competitor_analyses(id),
  similarity_score float8 default 0,
  created_at timestamptz default now()
);

-- Add RLS policies
alter table competitor_groups enable row level security;
alter table competitor_group_entries enable row level security;

create policy "Users can view their own competitor groups"
  on competitor_groups for select
  using (auth.uid() = user_id);

create policy "Users can insert their own competitor groups"
  on competitor_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own competitor groups"
  on competitor_groups for update
  using (auth.uid() = user_id);

create policy "Users can delete their own competitor groups"
  on competitor_groups for delete
  using (auth.uid() = user_id);

create policy "Users can view their group entries"
  on competitor_group_entries for select
  using (
    exists (
      select 1 from competitor_groups
      where competitor_groups.id = group_id
      and competitor_groups.user_id = auth.uid()
    )
  );

create policy "Users can insert their group entries"
  on competitor_group_entries for insert
  with check (
    exists (
      select 1 from competitor_groups
      where competitor_groups.id = group_id
      and competitor_groups.user_id = auth.uid()
    )
  );

create policy "Users can update their group entries"
  on competitor_group_entries for update
  using (
    exists (
      select 1 from competitor_groups
      where competitor_groups.id = group_id
      and competitor_groups.user_id = auth.uid()
    )
  );

create policy "Users can delete their group entries"
  on competitor_group_entries for delete
  using (
    exists (
      select 1 from competitor_groups
      where competitor_groups.id = group_id
      and competitor_groups.user_id = auth.uid()
    )
  );

-- Add soft delete columns to competitor_analyses
alter table competitor_analyses 
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references auth.users(id),
add column if not exists restored_at timestamptz,
add column if not exists restored_by uuid references auth.users(id);

-- Create deleted_competitor_analyses view
create view deleted_competitor_analyses as
select 
  id,
  competitor_name,
  user_id,
  deleted_at,
  deleted_by
from competitor_analyses
where deleted_at is not null
and restored_at is null;

