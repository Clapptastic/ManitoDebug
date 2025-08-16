-- Create table to persist flow monitor test runs (last 5 per user)
create table if not exists public.flow_test_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  run_type text not null default 'competitor_flow_monitor',
  competitor text,
  prompt text,
  steps jsonb not null default '[]'::jsonb,
  providers jsonb not null default '[]'::jsonb,
  success boolean not null default false,
  function_error jsonb,
  report jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.flow_test_runs enable row level security;

-- Policies: users can manage their own runs
create policy if not exists "Users can insert their own flow test runs"
  on public.flow_test_runs for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can view their own flow test runs"
  on public.flow_test_runs for select
  using (auth.uid() = user_id);

-- Optional update/delete (not strictly needed but useful)
create policy if not exists "Users can update their own flow test runs"
  on public.flow_test_runs for update
  using (auth.uid = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users can delete their own flow test runs"
  on public.flow_test_runs for delete
  using (auth.uid() = user_id);

-- Index for fast retrieval
create index if not exists idx_flow_test_runs_user_created on public.flow_test_runs (user_id, created_at desc);

-- Trigger function to keep only last 5 per user per run_type
create or replace function public.cleanup_old_flow_test_runs()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from public.flow_test_runs
  where user_id = new.user_id
    and run_type = new.run_type
    and id not in (
      select id from public.flow_test_runs
      where user_id = new.user_id and run_type = new.run_type
      order by created_at desc
      limit 5
    );
  return new;
end;
$$;

-- Attach trigger
create trigger trg_cleanup_old_flow_test_runs
after insert on public.flow_test_runs
for each row execute function public.cleanup_old_flow_test_runs();

-- RPC to insert a run (ensures user_id = auth.uid())
create or replace function public.insert_flow_test_run(
  run_type_param text default 'competitor_flow_monitor',
  competitor_param text default null,
  prompt_param text default null,
  steps_param jsonb default '[]'::jsonb,
  providers_param jsonb default '[]'::jsonb,
  success_param boolean default false,
  function_error_param jsonb default null,
  report_param jsonb default null
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.flow_test_runs(
    user_id, run_type, competitor, prompt, steps, providers, success, function_error, report
  ) values (
    auth.uid(), run_type_param, competitor_param, prompt_param, steps_param, providers_param, success_param, function_error_param, report_param
  ) returning id into new_id;

  return new_id;
end;
$$;

-- RPC to fetch last N runs for current user
create or replace function public.get_last_flow_test_runs(
  run_type_param text default 'competitor_flow_monitor',
  limit_param integer default 5
) returns setof public.flow_test_runs
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select * from public.flow_test_runs
  where user_id = auth.uid() and run_type = run_type_param
  order by created_at desc
  limit greatest(limit_param, 1);
end;
$$;