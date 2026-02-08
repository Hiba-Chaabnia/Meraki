-- ═══════════════════════════════════════════════════════════
-- 006 — Drop the nudges table
--
-- The motivation nudge is now derived, not stored. `frontend/src/lib/nudge.ts`
-- computes it from dashboard state the page already holds, so there is nothing
-- to persist: the same state yields the same sentence, and re-reading a row
-- would only tell us what we just computed.
--
-- The table was fed by `save_nudge`, called from `run_motivation_check_job`,
-- reached through `POST /motivation/check`. All three are deleted, so nothing
-- writes here any more and nothing reads it.
--
-- ─── BEFORE RUNNING ────────────────────────────────────────
-- This is destructive and irreversible. Check what you are dropping:
--
--     select count(*) from public.nudges;
--
-- It should be 0. The write path was never reachable in production — on `main`
-- the only caller of `triggerMotivationCheck` was `useDashboardData.ts`, which
-- nothing imported, and the branch that replaced it dropped the render too. A
-- non-zero count means something did run (a manual crew invocation, or a row
-- inserted by hand for testing); export it first if you want to keep it.
--
-- Run AFTER 005_hobby_lifecycle.sql.
-- ═══════════════════════════════════════════════════════════


-- Policies and the index go with the table, but dropping them explicitly keeps
-- this readable as a record of everything that existed.
drop policy if exists "Users can read own nudges"   on public.nudges;
drop policy if exists "Users can update own nudges" on public.nudges;

drop index if exists public.idx_nudges_user_created;

drop table if exists public.nudges;
