
-- Create a storage bucket for code files
insert into storage.buckets (id, name, public)
values ('code-files', 'code-files', true);

-- Create a policy to allow users to upload files
create policy "Users can upload code files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'code-files');

-- Create a policy to allow users to read files
create policy "Users can read code files"
  on storage.objects for select to authenticated
  using (bucket_id = 'code-files');
