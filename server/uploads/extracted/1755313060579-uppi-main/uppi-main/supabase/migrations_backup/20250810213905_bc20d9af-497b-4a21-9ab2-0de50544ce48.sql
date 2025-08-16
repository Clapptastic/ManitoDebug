-- Stage 2: Feature Flags (global/org/user) with secure RLS and RPCs
-- Create tables
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  description text,
  default_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  scope_type text not null check (scope_type in ('global','organization','user')),
  scope_id uuid,
  enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flag_overrides_scope_chk check (
    (scope_type = 'global' and scope_id is null) or
    (scope_type in ('organization','user'))
  )
);

create table if not exists public.feature_flag_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.feature_flags enable row level security;
alter table public.feature_flag_overrides enable row level security;
alter table public.feature_flag_audit enable row level security;

-- Policies: authenticated can read flags and overrides; only admins/service_role can write
create policy if not exists feature_flags_read on public.feature_flags for select using (auth.role() = 'authenticated');
create policy if not exists feature_flag_overrides_read on public.feature_flag_overrides for select using (auth.role() = 'authenticated');
create policy if not exists feature_flag_audit_read on public.feature_flag_audit for select using (get_user_role(auth.uid()) = any(array['admin','super_admin']) or auth.role() = 'service_role');

create policy if not exists feature_flags_admin_all on public.feature_flags for all using ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role') with check ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role');
create policy if not exists feature_flag_overrides_admin_all on public.feature_flag_overrides for all using ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role') with check ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role');
create policy if not exists feature_flag_audit_admin_all on public.feature_flag_audit for insert using ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role') with check ((get_user_role(auth.uid()) = any(array['admin','super_admin'])) or auth.role() = 'service_role');

-- updated_at triggers
create trigger set_feature_flags_updated_at before update on public.feature_flags for each row execute function public.update_updated_at_column();
create trigger set_feature_flag_overrides_updated_at before update on public.feature_flag_overrides for each row execute function public.update_updated_at_column();

-- Seed default flag (master_profiles enabled by default)
insert into public.feature_flags(flag_key, description, default_enabled)
values ('master_profiles','Controls visibility and functionality for Master Company Profiles', true)
on conflict (flag_key) do nothing;

-- Helper: ensure one global override per flag (optional, but useful)
create unique index if not exists uq_flag_global on public.feature_flag_overrides(flag_id, scope_type) where scope_type = 'global';
create index if not exists idx_flag_overrides_flag on public.feature_flag_overrides(flag_id);
create index if not exists idx_flag_overrides_scope on public.feature_flag_overrides(scope_type, scope_id);

-- RPC: get_effective_feature_flag(flag_key, user_id)
create or replace function public.get_effective_feature_flag(flag_key_param text, user_id_param uuid default auth.uid())
returns table(enabled boolean, source text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag public.feature_flags%rowtype;
  v_enabled boolean;
  v_source text;
  v_org_id uuid;
begin
  -- fetch flag row
  select * into v_flag from public.feature_flags where flag_key = flag_key_param limit 1;
  if not found then
    -- unknown flag -> disabled by default
    return query select false as enabled, 'default'::text as source; return;
  end if;

  -- 1) user override
  if user_id_param is not null then
    select enabled into v_enabled
    from public.feature_flag_overrides o
    where o.flag_id = v_flag.id and o.scope_type = 'user' and o.scope_id = user_id_param
    limit 1;
    if found then
      return query select v_enabled, 'user'::text; return;
    end if;

    -- 2) organization override (pick any active org membership)
    select organization_id into v_org_id
    from public.organization_members om
    where om.user_id = user_id_param and om.is_active = true
    order by om.created_at desc
    limit 1;

    if v_org_id is not null then
      select enabled into v_enabled
      from public.feature_flag_overrides o
      where o.flag_id = v_flag.id and o.scope_type = 'organization' and o.scope_id = v_org_id
      limit 1;
      if found then
        return query select v_enabled, 'organization'::text; return;
      end if;
    end if;
  end if;

  -- 3) global override
  select enabled into v_enabled
  from public.feature_flag_overrides o
  where o.flag_id = v_flag.id and o.scope_type = 'global' and o.scope_id is null
  limit 1;
  if found then
    return query select v_enabled, 'global'::text; return;
  end if;

  -- 4) default
  return query select v_flag.default_enabled, 'default'::text; return;
end;
$$;

-- RPC: set_feature_flag(flag_key, scope_type, scope_id, enabled)
create or replace function public.set_feature_flag(flag_key_param text, scope_type_param text, scope_id_param uuid, enabled_param boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag_id uuid;
  v_actor uuid := auth.uid();
begin
  if not ((get_user_role(v_actor) = any(array['admin','super_admin'])) or auth.role() = 'service_role') then
    raise exception 'Access denied';
  end if;

  -- ensure flag exists
  insert into public.feature_flags(flag_key, default_enabled)
  values (flag_key_param, true)
  on conflict (flag_key) do nothing;

  select id into v_flag_id from public.feature_flags where flag_key = flag_key_param limit 1;

  if scope_type_param = 'global' then
    insert into public.feature_flag_overrides(flag_id, scope_type, scope_id, enabled)
    values (v_flag_id, 'global', null, enabled_param)
    on conflict (flag_id, scope_type) where scope_type = 'global'
    do update set enabled = excluded.enabled, updated_at = now();
  elsif scope_type_param = 'organization' then
    insert into public.feature_flag_overrides(flag_id, scope_type, scope_id, enabled)
    values (v_flag_id, 'organization', scope_id_param, enabled_param)
    on conflict (flag_id, scope_type, scope_id)
    do update set enabled = excluded.enabled, updated_at = now();
  elsif scope_type_param = 'user' then
    insert into public.feature_flag_overrides(flag_id, scope_type, scope_id, enabled)
    values (v_flag_id, 'user', scope_id_param, enabled_param)
    on conflict (flag_id, scope_type, scope_id)
    do update set enabled = excluded.enabled, updated_at = now();
  else
    raise exception 'Invalid scope_type: %', scope_type_param;
  end if;

  -- audit
  insert into public.feature_flag_audit(actor_id, action, flag_id, details)
  values (v_actor, 'set_feature_flag', v_flag_id, jsonb_build_object(
    'scope_type', scope_type_param,
    'scope_id', scope_id_param,
    'enabled', enabled_param
  ));

  return true;
end;
$$;