-- Enable required extensions (safe if already enabled)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- P1.1: Provider preferences table
create table if not exists public.provider_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  organization_id uuid null,
  provider text not null,
  task_category text not null check (task_category in ('search','qa','enrichment')),
  enabled boolean not null default true,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_preferences_scope_chk check (user_id is not null or organization_id is not null)
);

-- Indexes for performance
create index if not exists idx_provider_prefs_user_provider_task
  on public.provider_preferences (user_id, provider, task_category);
create index if not exists idx_provider_prefs_org_provider_task
  on public.provider_preferences (organization_id, provider, task_category);
create index if not exists idx_provider_prefs_priority
  on public.provider_preferences (priority);

-- Updated at trigger
create trigger set_provider_preferences_updated_at
before update on public.provider_preferences
for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.provider_preferences enable row level security;

-- Policies
create policy if not exists "Users manage own provider preferences"
  on public.provider_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "Org admins manage org provider preferences"
  on public.provider_preferences
  for all
  using (organization_id is not null and public.check_organization_permission(auth.uid(), organization_id, 'admin'))
  with check (organization_id is not null and public.check_organization_permission(auth.uid(), organization_id, 'admin'));

create policy if not exists "Service role full access - provider preferences"
  on public.provider_preferences
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- P1.2: api_usage_costs organization_id column and indexes
alter table public.api_usage_costs add column if not exists organization_id uuid;
create index if not exists idx_api_usage_costs_org on public.api_usage_costs (organization_id);
create index if not exists idx_api_usage_costs_date_org on public.api_usage_costs (date, organization_id);

-- Org admin SELECT access (in addition to existing policies)
create policy if not exists "Org admins can view org api usage costs"
  on public.api_usage_costs
  for select
  using (organization_id is not null and public.check_organization_permission(auth.uid(), organization_id, 'admin'));

-- P1.3: Trigger to populate organization_id on insert
create or replace function public.set_api_usage_org_id()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.organization_id is null and new.user_id is not null then
    select om.organization_id
      into new.organization_id
    from public.organization_members om
    where om.user_id = new.user_id
      and om.is_active = true
    order by case om.role when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 when 'member' then 4 else 5 end
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_api_usage_org_id on public.api_usage_costs;
create trigger trg_set_api_usage_org_id
before insert on public.api_usage_costs
for each row execute function public.set_api_usage_org_id();

-- P1.4: Aggregation view for org monthly costs
create or replace view public.v_org_monthly_costs as
select
  organization_id,
  date_trunc('month', request_timestamp) as month,
  provider,
  count(*)::bigint as requests,
  sum(usage_count)::bigint as usage_count,
  sum(cost_usd)::numeric as total_cost_usd
from public.api_usage_costs
group by organization_id, month, provider;

-- P1.5: Nightly cron to consolidate master profiles (03:00)
-- Note: Uses anon key as JWT for public invocation; ensure function allows anon or adjust as needed.
select cron.schedule(
  'invoke-bulk-consolidate-companies-nightly',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://jqbdjttdaihidoyalqvs.functions.supabase.co/bulk-consolidate-companies',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
