-- ═══════════════════════════════════════════════════════════
-- 008 — Drop notification preferences
--
-- The Settings page offered four toggles: email notifications, streak
-- reminders, challenge alerts and a weekly digest. There is no email
-- infrastructure and no scheduler anywhere in this repo, so nothing has ever
-- read this column — the toggles recorded a consent decision about emails that
-- could not be sent.
--
-- Worse than useless: the privacy policy described those emails as a real
-- processing purpose under "your consent", and named the toggles as the way to
-- withdraw it. A consent record for a non-existent purpose is a liability, not
-- a feature. The toggles, the policy section, and now the column are gone.
--
-- If notification emails are built later, the preference should be re-added
-- alongside the sender — not before it.
--
-- Run AFTER 007_challenge_skip.sql.
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  drop column if exists notification_prefs;
