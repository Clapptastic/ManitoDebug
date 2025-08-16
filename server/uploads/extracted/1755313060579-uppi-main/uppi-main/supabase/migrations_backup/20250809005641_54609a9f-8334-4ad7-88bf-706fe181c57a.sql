-- Retry: create prompts schema, policies, and triggers with safe drops

-- 1) Tables (idempotent)
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  provider text not null,
  domain text not null,
  description text,
  current_version_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  version integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  is_rollback boolean not null default false
);

-- 2) Indexes
create index if not exists idx_prompts_key on public.prompts(key);
create index if not exists idx_prompts_domain on public.prompts(domain);
create index if not exists idx_prompts_provider on public.prompts(provider);
create unique index if not exists ux_prompt_versions_prompt_id_version on public.prompt_versions(prompt_id, version);

-- 3) Triggers
-- Updated_at trigger for prompts
drop trigger if exists update_prompts_updated_at on public.prompts;
create trigger update_prompts_updated_at
before update on public.prompts
for each row execute function public.update_updated_at_column();

-- Auto-increment version per prompt
create or replace function public.set_prompt_version()
returns trigger as $$
begin
  if new.version is null or new.version <= 0 then
    select coalesce(max(version), 0) + 1 into new.version
    from public.prompt_versions
    where prompt_id = new.prompt_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_prompt_version on public.prompt_versions;
create trigger trg_set_prompt_version
before insert on public.prompt_versions
for each row execute function public.set_prompt_version();

-- 4) Row Level Security
alter table public.prompts enable row level security;
alter table public.prompt_versions enable row level security;

-- 5) Policies (drop-if-exists then create)
-- prompts
drop policy if exists prompts_select_super_admin_or_service on public.prompts;
create policy prompts_select_super_admin_or_service
on public.prompts for select
using (
  public.get_user_role(auth.uid()) = 'super_admin' or auth.role() = 'service_role'
);

drop policy if exists prompts_insert_super_admin on public.prompts;
create policy prompts_insert_super_admin
on public.prompts for insert
with check (
  public.get_user_role(auth.uid()) = 'super_admin'
);

drop policy if exists prompts_update_super_admin on public.prompts;
create policy prompts_update_super_admin
on public.prompts for update
using (
  public.get_user_role(auth.uid()) = 'super_admin'
) with check (
  public.get_user_role(auth.uid()) = 'super_admin'
);

drop policy if exists prompts_delete_super_admin on public.prompts;
create policy prompts_delete_super_admin
on public.prompts for delete
using (
  public.get_user_role(auth.uid()) = 'super_admin'
);

-- prompt_versions
drop policy if exists prompt_versions_select_super_admin_or_service on public.prompt_versions;
create policy prompt_versions_select_super_admin_or_service
on public.prompt_versions for select
using (
  public.get_user_role(auth.uid()) = 'super_admin' or auth.role() = 'service_role'
);

drop policy if exists prompt_versions_insert_super_admin on public.prompt_versions;
create policy prompt_versions_insert_super_admin
on public.prompt_versions for insert
with check (
  public.get_user_role(auth.uid()) = 'super_admin'
);

drop policy if exists prompt_versions_update_super_admin on public.prompt_versions;
create policy prompt_versions_update_super_admin
on public.prompt_versions for update
using (
  public.get_user_role(auth.uid()) = 'super_admin'
) with check (
  public.get_user_role(auth.uid()) = 'super_admin'
);

drop policy if exists prompt_versions_delete_super_admin on public.prompt_versions;
create policy prompt_versions_delete_super_admin
on public.prompt_versions for delete
using (
  public.get_user_role(auth.uid()) = 'super_admin'
);
