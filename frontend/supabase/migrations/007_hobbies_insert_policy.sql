-- Allow authenticated users to insert new hobbies (custom hobby creation)
create policy "Authenticated users can insert hobbies"
  on public.hobbies for insert
  to authenticated
  with check (true);
