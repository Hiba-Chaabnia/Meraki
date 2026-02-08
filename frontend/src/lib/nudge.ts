/**
 * The dashboard's motivation nudge — one sentence under the greeting.
 *
 * This replaced a CrewAI agent. `motivation_crew/config/tasks.yaml` asked a
 * language model to apply rules the prompt itself stated ("0-3 gentle, 4-7
 * check_in, 8+ re_engage") and to pick from six enumerated types, so four of
 * the five fields it returned were classifications the inputs already
 * determined — billed per call, and less reliable than a comparison operator.
 * `NudgeUrgencyCalibrationMetric` existed to check whether the model had
 * correctly applied a rule we already knew.
 *
 * What remains is a decision table and a template bank. The personalisation
 * that carries the message is the numbers — days away, sessions logged, streak
 * length — and those are slots, not prose. `Greeting` already proved the point
 * with static copy: "It's been 12 days. Everything's exactly where you left it."
 *
 * Pure, like `deriveVariant` and `pickSuggestedHobbyId` next door, so the
 * preview feeds it the same fixtures the real page derives from.
 */

import type { DashboardHobby, DashboardVariant, StreakState } from "./dashboardHome";

/** Kept aligned with the crew's vocabulary so the two can be compared. */
export type NudgeKind =
  | "streak_reminder"
  | "micro_session"
  | "fresh_start"
  | "challenge_prompt";

export interface NudgeContext {
  variant: DashboardVariant;
  streak: StreakState;
  hobbies: DashboardHobby[];
  /** Whether any challenge is live — decides between prompt and micro-session. */
  hasLiveChallenge: boolean;
}

export interface DerivedNudge {
  kind: NudgeKind;
  message: string;
}

/** Matches DORMANT_AFTER_DAYS: past this the dashboard is a re-entry screen. */
const AWAY_LONG = 14;
/** The crew's "re_engage" boundary. */
const AWAY_MEDIUM = 8;
/** The crew's "check_in" boundary. */
const AWAY_SHORT = 4;
/** Below this, "don't break your streak" is not yet a true statement. */
const STREAK_AT_RISK_FROM = 3;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The active hobby practised most recently — the easiest door back in, and the
 * one whose gap the rest of the dashboard already reasons about: `deriveVariant`
 * calls a dashboard dormant when the *smallest* gap passes DORMANT_AFTER_DAYS,
 * and `Greeting` reports that same smallest gap. Naming the most neglected
 * hobby instead would state a different number than the line it replaces.
 *
 * Never-practised hobbies are excluded: "you haven't been back" is not true of
 * something never started.
 */
function mostRecentlyPractised(hobbies: DashboardHobby[]): DashboardHobby | null {
  const practised = hobbies.filter((h) => h.status === "active" && h.lastSessionDaysAgo !== null);
  if (practised.length === 0) return null;
  return practised.reduce((best, h) =>
    (h.lastSessionDaysAgo ?? 0) < (best.lastSessionDaysAgo ?? 0) ? h : best,
  );
}

/**
 * Two or three phrasings per branch, chosen by a stable hash of the inputs
 * rather than at random: the same dashboard renders the same sentence on a
 * refresh, and there is no hydration mismatch to design around.
 */
function pick(variants: string[], seed: number): string {
  return variants[Math.abs(seed) % variants.length];
}

export function deriveNudge(ctx: NudgeContext): DerivedNudge | null {
  const { variant, streak, hobbies, hasLiveChallenge } = ctx;

  // The greeting already speaks to these, and both are states the user chose.
  if (variant === "new" || variant === "all-paused") return null;
  // Today is covered. Nothing to ask for.
  if (streak.loggedToday) return null;

  const hobby = mostRecentlyPractised(hobbies);
  if (!hobby) return null;

  const away = hobby.lastSessionDaysAgo ?? 0;
  const name = hobby.name;
  const seed = away + hobby.totalSessions + streak.days;

  // ── Long gap: re-entry, and the only job is to make coming back feel small.
  if (away >= AWAY_LONG) {
    return {
      kind: "fresh_start",
      message: pick(
        [
          `It's been ${plural(away, "day")} — you haven't lost anything.`,
          `${name} will keep. Pick it up whenever.`,
        ],
        seed,
      ),
    };
  }

  // ── Medium gap: still recoverable, so shrink the ask rather than raise it.
  if (away >= AWAY_MEDIUM) {
    return {
      kind: "micro_session",
      message: pick(
        [
          `${plural(away, "day")} since ${name}. Ten minutes would do.`,
          `Even ten minutes on ${name} counts.`,
        ],
        seed,
      ),
    };
  }

  // ── Short gap with a challenge live: point at the thing already queued.
  if (away >= AWAY_SHORT && hasLiveChallenge) {
    return {
      kind: "challenge_prompt",
      message: pick(
        [`Your ${name} challenge is still open.`, `Your ${name} challenge is where you left it.`],
        seed,
      ),
    };
  }

  if (away >= AWAY_SHORT) {
    return {
      kind: "micro_session",
      message: pick(
        [
          `${plural(away, "day")} since ${name}. Ten minutes would do.`,
          `Even ten minutes on ${name} counts.`,
        ],
        seed,
      ),
    };
  }

  /* ── A real streak that today has not yet extended.
     Never restates the day count: <StreakChip> already renders "12-day streak"
     in the amber that means today is still open, so repeating the number here
     is the same fact twice on one screen. */
  if (streak.days >= STREAK_AT_RISK_FROM) {
    return {
      kind: "streak_reminder",
      message: pick(
        [`You can still keep the ${name} run going.`, `A short sitting today keeps your run alive.`],
        seed,
      ),
    };
  }

  /* Recently practised with no streak worth protecting: nothing specific to
     say, so say nothing and let `Greeting`'s static line stand. A derived
     sentence here would be filler occupying the slot — "Pottery was
     yesterday." states a fact the reader has no reason to care about. */
  return null;
}
