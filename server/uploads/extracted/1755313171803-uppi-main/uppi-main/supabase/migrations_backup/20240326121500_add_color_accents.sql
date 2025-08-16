
-- Create color_accents table
create table if not exists color_accents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  theme_name text not null,
  primary_color text not null,
  secondary_color text not null,
  accent_color text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, theme_name)
);

-- Add RLS policies
alter table color_accents enable row level security;

create policy "Users can view their own color accents"
  on color_accents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own color accents"
  on color_accents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own color accents"
  on color_accents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own color accents"
  on color_accents for delete
  using (auth.uid() = user_id);

-- Add function to get user's theme colors
create or replace function get_user_theme_colors(p_theme_name text)
returns table (
  primary_color text,
  secondary_color text,
  accent_color text
) as $$
begin
  return query
  select c.primary_color, c.secondary_color, c.accent_color
  from color_accents c
  where c.user_id = auth.uid()
  and c.theme_name = p_theme_name;
end;
$$ language plpgsql security definer;
