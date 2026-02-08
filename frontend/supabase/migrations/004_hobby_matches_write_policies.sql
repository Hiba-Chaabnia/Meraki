-- Add missing INSERT and DELETE RLS policies for hobby_matches.
-- Without these, the frontend saveHobbyMatches server action silently fails
-- because only a SELECT policy existed.

create policy "Users can insert own matches"
  on public.hobby_matches for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own matches"
  on public.hobby_matches for delete
  to authenticated using (auth.uid() = user_id);
