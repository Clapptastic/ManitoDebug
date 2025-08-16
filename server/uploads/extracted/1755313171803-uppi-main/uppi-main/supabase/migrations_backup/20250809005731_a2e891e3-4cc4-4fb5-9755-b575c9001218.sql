-- Fix linter warning: set immutable search_path for trigger function
create or replace function public.set_prompt_version()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.version is null or new.version <= 0 then
    select coalesce(max(version), 0) + 1 into new.version
    from public.prompt_versions
    where prompt_id = new.prompt_id;
  end if;
  return new;
end;
$$;