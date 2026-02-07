-- ═══════════════════════════════════════════════════════════
-- 005 — Hobby lifecycle: rename and delete
--
-- Until now a hobby could only be added and practised. `updateHobbyStatus`
-- accepted four statuses and had exactly one call site, passing 'active'.
-- This migration supplies the two things the app could not do without schema
-- support: rename, and a delete that does not leave orphans behind.
--
-- Run AFTER 004_dashboard_card_fields.sql.
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- 1. Rename
--
-- `hobby_slug` cannot carry the display name. It is the identity: unique per
-- user, and the join key for user_roadmaps.hobby_slug and challenges.hobby_slug
-- (neither of which is a real FK — see section 2). Renaming by rewriting the
-- slug would silently detach a hobby from its roadmap and its challenges.
--
-- So the name lives beside it. Null means "derive it from the slug", which is
-- what every row does today and what formatSlug() has always done.
-- ─────────────────────────────────────────────────────────

alter table public.user_hobbies
  add column if not exists custom_name text;

comment on column public.user_hobbies.custom_name is
  'User-chosen display name. Null = derive from hobby_slug via formatSlug().';


-- ─────────────────────────────────────────────────────────
-- 2. Delete policies
--
-- user_hobbies already had a delete policy from the initial schema, unused
-- because no action ever called it. But deleting the hobby row only cascades
-- practice_sessions (the one table with a real FK to user_hobbies).
--
-- user_roadmaps and user_challenges are joined by slug, not by foreign key, so
-- they survive the delete and reattach to the next hobby added with the same
-- slug — a "new" hobby arriving with a stale roadmap and someone else's
-- finished challenges. deleteUserHobby() clears them explicitly, which needs
-- these policies: RLS silently drops deletes rather than erroring.
-- ─────────────────────────────────────────────────────────

drop policy if exists "Users can delete own roadmaps" on public.user_roadmaps;
create policy "Users can delete own roadmaps"
  on public.user_roadmaps for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own challenges" on public.user_challenges;
create policy "Users can delete own challenges"
  on public.user_challenges for delete to authenticated using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 3. Drop the 'completed' status
--
-- It was in the check constraint from day one and nothing ever set it or read
-- it. It also contradicts the product: Meraki is about exploration and "no long
-- commitments", and a hobby is not a thing you finish. The only sensible
-- meaning — "reached the last roadmap stage" — is an achievement and belongs in
-- milestones with a celebration, not as a third resting state competing with
-- paused.
--
-- 'paused' already covers "not right now" and delete covers "not ever".
--
-- Any row that somehow reached 'completed' is moved to 'paused' first, so the
-- new constraint cannot fail on existing data. There should be none.
-- ─────────────────────────────────────────────────────────

update public.user_hobbies set status = 'paused' where status = 'completed';

alter table public.user_hobbies
  drop constraint if exists user_hobbies_status_check;

alter table public.user_hobbies
  add constraint user_hobbies_status_check
  check (status in ('sampling', 'active', 'paused'));


-- ─────────────────────────────────────────────────────────
-- 4. On the active-hobby cap
--
-- MAX_ACTIVE_HOBBIES lives in src/lib/hobbyLimits.ts, not here. A check
-- constraint cannot count sibling rows, and a trigger that rejects an insert
-- would surface to the user as a raw Postgres error rather than the sentence
-- the modal wants to show. The server actions are the only writer, so the
-- guard sits there.
-- ─────────────────────────────────────────────────────────
