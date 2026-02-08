-- ═══════════════════════════════════════════════════════════
-- 007 — Make skipping a challenge a real user action
--
-- `skipped` existed but no user could ever set it. It was written only as a
-- side effect of `_skip_previous_active_challenges`, which retired whatever an
-- AI-generated replacement superseded — so the label said "you skipped this"
-- while meaning "the system replaced this".
--
-- Generation is now guarded: you cannot generate while a challenge is active.
-- That leaves skipping as the honest way out of a challenge you do not want,
-- instead of "Mark as done", which would inflate `challengesCompleted` — a
-- stat that feeds get_user_stats, the Progress page, and the
-- challenge-champion milestone.
--
-- Run AFTER 006_drop_nudges.sql.
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- 1. When it was skipped
--
-- `completed_at` deliberately stays null for a skipped row — it means "when
-- completed", and a skipped challenge was not. So the rate limit needs its own
-- column: one skip per hobby per day, checked against the newest skip.
-- ─────────────────────────────────────────────────────────

alter table public.user_challenges
  add column if not exists skipped_at timestamptz;

-- Existing rows were all system-retired, not user-skipped. Stamping them with
-- `started_at` keeps the column non-null where a skip really happened while
-- being honest that we do not know the real moment.
update public.user_challenges
   set skipped_at = coalesce(skipped_at, started_at, now())
 where status = 'skipped' and skipped_at is null;


-- ─────────────────────────────────────────────────────────
-- 2. Index for the two reads the guard performs
--
-- "is there an active challenge for this hobby" and "when was the last skip",
-- both scoped to one user.
-- ─────────────────────────────────────────────────────────

create index if not exists idx_user_challenges_user_status
  on public.user_challenges(user_id, status, skipped_at desc);

-- Same (user_id, status) prefix, so every query the old one served is covered.
drop index if exists idx_user_challenges_user;


-- ─────────────────────────────────────────────────────────
-- 3. Drop the `upcoming` status
--
-- The column default, but nothing ever wrote it: save_generated_challenge
-- always inserts 'active'. A state no code could produce and no screen could
-- reach, kept alive only by the check constraint and a `?? "upcoming"` fallback
-- on a NOT NULL column.
-- ─────────────────────────────────────────────────────────

update public.user_challenges set status = 'active' where status = 'upcoming';

alter table public.user_challenges
  alter column status set default 'active';

alter table public.user_challenges
  drop constraint if exists user_challenges_status_check;

alter table public.user_challenges
  add constraint user_challenges_status_check
  check (status in ('active', 'completed', 'skipped'));
