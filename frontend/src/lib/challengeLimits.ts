/**
 * How long after a swap before another is allowed, per hobby.
 *
 * Unlimited rerolls make the challenge a slot machine — you keep spinning until
 * one looks easy, and the cap is what gives the offer meaning.
 *
 * It lives here rather than in `app/actions/challenges.ts` because that file is
 * `"use server"`, and a server-actions module may only export async functions —
 * a plain const compiles fine and then fails at runtime. The client needs the
 * number too, to grey the button out before the click rather than after.
 */
export const SKIP_COOLDOWN_HOURS = 24;

/**
 * Hours left on the cooldown for a hobby, or 0 when a swap is available.
 *
 * `skippedDates` is every skip on record for that hobby; the newest is the only
 * one that matters. Rounded up, so "1 hour left" never means "in fifty minutes".
 */
export function swapCooldownLeft(skippedDates: (string | null)[]): number {
  const newest = skippedDates
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  if (!newest) return 0;

  const elapsed = (Date.now() - new Date(newest).getTime()) / 3_600_000;
  return elapsed >= SKIP_COOLDOWN_HOURS ? 0 : Math.ceil(SKIP_COOLDOWN_HOURS - elapsed);
}
