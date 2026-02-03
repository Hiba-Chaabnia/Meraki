-- ═══════════════════════════════════════════════════════════
-- Meraki — Migration 003: per-task job progress
-- Run manually via the Supabase SQL editor — this repo has no
-- CLI-linked migration flow (schema.sql is a single hand-applied dump).
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- jobs.progress
--
-- Number of crew tasks FINISHED so far, 0-based-exclusive:
--   0 = nothing done yet (queued, or first task still running)
--   1 = first task done, second running
--   n = all n tasks done (set just before status flips to 'completed')
--
-- The backend writes this from a CrewAI task_callback after each task.
-- The frontend renders it as a live checklist on the analyzing screen.
--
-- Deliberately a plain int rather than a step name: task names are a
-- backend implementation detail, and the client already knows the labels
-- it wants to show. Total step count is a client-side constant per crew.
-- ─────────────────────────────────────────────────────────
alter table public.jobs
  add column if not exists progress integer not null default 0;


-- Existing finished jobs report no intermediate progress; leaving them at 0
-- is correct — the client only reads progress while status = 'running'.
