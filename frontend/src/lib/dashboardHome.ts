/* ═══════════════════════════════════════════════════════
   Dashboard home — view model.

   Everything the "Compact Command" home renders is DERIVED from the raw
   hobbies / sessions / challenges / roadmaps the hook fetches. Nothing here
   is stored: which state the page is in, which row is suggested, the streak
   chip variant and the week strip are all recomputed on every render.

   Pure functions only — no React, no server actions. The real page and
   /preview/pages/dashboard both feed <DashboardHome> from these shapes.
   ═══════════════════════════════════════════════════════ */

import {
  roadmapGoalKey,
  type ActiveHobby,
  type Challenge,
  type PracticeSession,
  type Roadmap,
} from "@/lib/dashboardData";

/** Collections alternate blue / lime by index — src/CLAUDE.md §2.2. */
export type HobbyTheme = "primary" | "secondary";

export interface DashboardHobby {
  userHobbyId: string;
  slug: string;
  name: string;
  theme: HobbyTheme;
  status: "active" | "paused";
  /** Roadmap position. stageCount === 0 means the hobby has no roadmap yet. */
  stage: number;
  stageCount: number;
  stageLabel: string;
  /** Checklist for the current roadmap phase. Empty for older roadmaps. */
  stageGoals: StageGoal[];
  /** For the toggle action; "" when the hobby has no roadmap. */
  userRoadmapId: string;
  totalSessions: number;
  longestStreak: number;
  /** null when the hobby has never been practised. */
  lastSessionDaysAgo: number | null;
  /** 1-based, straight from `ActiveHobby.daysSinceStart`. 1 means "today". */
  addedDaysAgo: number;
  /** ISO date the hobby was paused; null while running or if paused pre-004. */
  pausedAt: string | null;
}

/** One tickable checklist item on a roadmap stage. */
export interface StageGoal {
  /** `roadmapGoalKey(phaseNumber, index)` — what the toggle action takes. */
  key: string;
  text: string;
  done: boolean;
}

/** One hobby's contribution to one day of the week strip. */
export interface WeekEntry {
  slug: string;
  name: string;
  theme: HobbyTheme;
  /** Summed across every session that hobby had that day. */
  minutes: number;
}

export interface WeekDay {
  /** Local YYYY-MM-DD. */
  date: string;
  /** Hobbies practised that day, in hobby order, one entry each. */
  entries: WeekEntry[];
  totalMinutes: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface StreakState {
  days: number;
  loggedToday: boolean;
}

export type DashboardVariant = "new" | "all-paused" | "dormant" | "active";

/** A hobby is dormant once nothing has been logged for this many days. */
export const DORMANT_AFTER_DAYS = 14;

/* ─── Date helpers ───────────────────────────────────────────────────────── */

/** Local (not UTC) YYYY-MM-DD — sessions are stamped in UTC but read locally. */
export function localDateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** Monday-first start of the calendar week containing `d`. */
function startOfWeek(d: Date): Date {
  const mondayOffset = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - mondayOffset);
}

/* ─── Heatmap ────────────────────────────────────────────────────────────── */

/** Minutes practised on one calendar day. */
export interface HeatmapDay {
  /** ISO timestamp of a session. */
  date: string;
  duration: number;
}

export interface Heatmap {
  cells: (0 | 1 | 2 | 3)[];
  /** Whole Monday-start weeks in `cells`. */
  weeks: number;
}

const HEATMAP_WEEKS = 12;

/**
 * Twelve weeks of practice intensity, one cell per day, Monday-first.
 *
 * Built here rather than in the server action for two reasons the old version
 * got wrong.
 *
 * **The grid is aligned to calendar weeks.** It used to run "83 days ago →
 * today" and chunk that into sevens, so a column was a rolling 7-day block
 * starting on whatever weekday fell 83 days back. The M/W/F/S row labels beside
 * it claimed otherwise, and were only truthful when today happened to be a
 * Sunday. Starting from `startOfWeek` makes each column a real week and the
 * labels true every day of the year.
 *
 * **Days are bucketed by the viewer's local date**, via the same `localDateKey`
 * `deriveStreak` uses. The server action keyed off `toISOString()`, so a session
 * logged at 9pm in a western timezone counted toward tomorrow's cell but today's
 * streak — the two disagreed about which day you practised.
 */
export function buildHeatmap(days: HeatmapDay[], now: Date = new Date()): Heatmap {
  const minutesByDay = new Map<string, number>();
  for (const d of days) {
    const key = localDateKey(new Date(d.date));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + d.duration);
  }

  // The last cell is the end of *this* week, so the current week is never a
  // stub — an in-progress week rendered short would misalign every row.
  const end = startOfWeek(now);
  end.setDate(end.getDate() + 6);
  const start = new Date(end);
  start.setDate(start.getDate() - (HEATMAP_WEEKS * 7 - 1));

  const cells: (0 | 1 | 2 | 3)[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < HEATMAP_WEEKS * 7; i += 1) {
    const minutes = minutesByDay.get(localDateKey(cursor)) ?? 0;
    cells.push(minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : 3);
    cursor.setDate(cursor.getDate() + 1);
  }

  return { cells, weeks: HEATMAP_WEEKS };
}

/* ─── Labels ─────────────────────────────────────────────────────────────── */

/** "today" | "yesterday" | "3 days ago" — the row's progress-bar sibling. */
export function lastSessionLabel(days: number | null): string {
  if (days === null) return "never";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * "Paused Aug 1" — the mockup's paused footer. Returns null for hobbies paused
 * before migration 004 added the column, where the caller falls back to the
 * last practice date rather than inventing one.
 */
export function pausedOnLabel(pausedAt: string | null): string | null {
  if (!pausedAt) return null;
  const d = new Date(pausedAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Paused ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/* ─── Hobbies ────────────────────────────────────────────────────────────── */

/** Longest run of consecutive calendar days present in `dateKeys`. */
function longestRun(dateKeys: string[]): number {
  const sorted = [...new Set(dateKeys)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;

  for (const key of sorted) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    run = prev && daysBetween(prev, date) === 1 ? run + 1 : 1;
    prev = date;
    if (run > best) best = run;
  }
  return best;
}

/** Pair a phase's goals with their ticked state from `completed_goals`. */
function buildStageGoals(
  phase: { phase_number: number; goals: string[] } | null,
  completedGoals: string[],
): StageGoal[] {
  if (!phase?.goals?.length) return [];
  const done = new Set(completedGoals);
  return phase.goals.map((text, i) => {
    const key = roadmapGoalKey(phase.phase_number, i);
    return { key, text, done: done.has(key) };
  });
}

/**
 * Active first, then most recently practised. Extracted because the theme a
 * hobby wears is its *position* in this order, not a property of the hobby —
 * so the hobby detail page has to reproduce the ordering to paint itself the
 * same colour as the card you clicked to get there.
 */
export function orderHobbies<T extends { slug: string; status: "active" | "paused" }>(
  hobbies: T[],
  lastSessionDate: (slug: string) => string,
): T[] {
  return [...hobbies].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return lastSessionDate(b.slug).localeCompare(lastSessionDate(a.slug));
  });
}

/**
 * `orderHobbies`' rule applied to `ActiveHobby`, which carries days-since as a
 * number rather than a date string.
 *
 * Same ordering, different input, and the difference matters: this needs only
 * the hobby rows. Ordering by date string forced every caller to load every
 * session first, which is why the hobby page used to fetch the whole account
 * before it could decide what colour to paint itself.
 */
export function orderActiveHobbies<
  T extends { status: "active" | "paused"; lastSessionDaysAgo: number },
>(hobbies: T[]): T[] {
  return [...hobbies].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.lastSessionDaysAgo - b.lastSessionDaysAgo;
  });
}

/** `themeForSlug` for callers holding `ActiveHobby[]` — see `orderActiveHobbies`. */
export function themeForActiveHobbies(
  hobbies: { slug: string; status: "active" | "paused"; lastSessionDaysAgo: number }[],
  slug: string,
): HobbyTheme {
  const index = orderActiveHobbies(hobbies).findIndex((h) => h.slug === slug);
  return index % 2 === 0 ? "primary" : "secondary";
}



/**
 * Fold hobbies, their sessions and their roadmaps into the row shape.
 * Active hobbies come first, then by most recently practised — the order the
 * blue/lime rhythm is assigned in, so it stays stable between renders.
 */
export function buildDashboardHobbies(
  hobbies: ActiveHobby[],
  sessions: PracticeSession[],
  roadmaps: Roadmap[],
  now: Date = new Date(),
): DashboardHobby[] {
  const sessionsBySlug = new Map<string, PracticeSession[]>();
  for (const s of sessions) {
    const list = sessionsBySlug.get(s.hobbySlug);
    if (list) list.push(s);
    else sessionsBySlug.set(s.hobbySlug, [s]);
  }

  const roadmapBySlug = new Map(roadmaps.map((r) => [r.hobbySlug, r]));

  const ordered = orderHobbies(hobbies, (slug) => sessionsBySlug.get(slug)?.[0]?.date ?? "");

  return ordered.map((h, index) => {
    // getSessions() returns newest-first, so [0] is the latest.
    const hobbySessions = sessionsBySlug.get(h.slug) ?? [];
    const latest = hobbySessions[0] ?? null;
    const roadmap = roadmapBySlug.get(h.slug) ?? null;

    const stageCount = roadmap?.totalPhases ?? 0;
    // current_phase is 0-based in the DB; the design counts stages from 1.
    const stage = roadmap ? Math.min(roadmap.currentPhase + 1, Math.max(stageCount, 1)) : 0;
    const phase = roadmap?.phases?.[roadmap.currentPhase] ?? null;

    return {
      userHobbyId: h.userHobbyId,
      slug: h.slug,
      name: h.name,
      theme: (index % 2 === 0 ? "primary" : "secondary") as HobbyTheme,
      status: h.status,
      stage,
      stageCount,
      stageLabel: phase?.title ?? "",
      stageGoals: buildStageGoals(phase, roadmap?.completedGoals ?? []),
      userRoadmapId: roadmap?.userRoadmapId ?? "",
      totalSessions: hobbySessions.length,
      longestStreak: longestRun(hobbySessions.map((s) => localDateKey(new Date(s.date)))),
      lastSessionDaysAgo: latest ? Math.max(0, daysBetween(new Date(latest.date), now)) : null,
      addedDaysAgo: h.daysSinceStart,
      pausedAt: h.pausedAt,
    };
  });
}

/* ─── Streak ─────────────────────────────────────────────────────────────── */

/**
 * Days in the current run, plus whether today is already covered.
 * A run that ended yesterday is still alive — that is the "today's still open"
 * chip. A run that ended two days ago is over.
 */
export function deriveStreak(sessions: PracticeSession[], now: Date = new Date()): StreakState {
  const keys = new Set(sessions.map((s) => localDateKey(new Date(s.date))));
  const loggedToday = keys.has(localDateKey(now));

  const cursor = startOfDay(now);
  if (!loggedToday) cursor.setDate(cursor.getDate() - 1);
  if (!keys.has(localDateKey(cursor))) return { days: 0, loggedToday };

  let days = 0;
  while (keys.has(localDateKey(cursor))) {
    days += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { days, loggedToday };
}

/* ─── Week strip ─────────────────────────────────────────────────────────── */

/**
 * Monday-first calendar week, one entry per hobby practised per day.
 *
 * Minutes are kept, not just the fact of a session: the strip draws pillars
 * whose height is the time spent, so a 90-minute Saturday reads differently
 * from a 10-minute one. `session.duration` used to be discarded here.
 */
export function buildWeek(
  sessions: PracticeSession[],
  hobbies: DashboardHobby[],
  now: Date = new Date(),
): WeekDay[] {
  const hobbyBySlug = new Map(hobbies.map((h) => [h.slug, h]));
  // date -> slug -> minutes. Insertion order is irrelevant; hobby order is
  // reimposed below so the stacked segments match the legend's reading order.
  const minutesByDate = new Map<string, Map<string, number>>();

  for (const s of sessions) {
    if (!hobbyBySlug.has(s.hobbySlug)) continue;
    const key = localDateKey(new Date(s.date));
    let bySlug = minutesByDate.get(key);
    if (!bySlug) {
      bySlug = new Map();
      minutesByDate.set(key, bySlug);
    }
    // A "thought" session is logged with duration 0 but still counts as
    // practice that day — the pillar floor in weekBarFraction keeps it visible.
    bySlug.set(s.hobbySlug, (bySlug.get(s.hobbySlug) ?? 0) + Math.max(0, s.duration));
  }

  const monday = startOfWeek(now);
  const todayKey = localDateKey(now);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = localDateKey(date);
    const bySlug = minutesByDate.get(key);

    const entries: WeekEntry[] = bySlug
      ? hobbies
          .filter((h) => bySlug.has(h.slug))
          .map((h) => ({
            slug: h.slug,
            name: h.name,
            theme: h.theme,
            minutes: bySlug.get(h.slug) ?? 0,
          }))
      : [];

    return {
      date: key,
      entries,
      totalMinutes: entries.reduce((sum, e) => sum + e.minutes, 0),
      isToday: key === todayKey,
      isFuture: daysBetween(now, date) > 0,
    };
  });
}

/** Shortest segment a practised hobby may draw, so a 5-minute session still reads. */
const MIN_BAR_FRACTION = 0.12;
/** Floor for the week's scale — stops a single light day filling the track. */
const MIN_SCALE_MINUTES = 60;

/** Scale reference for the whole week: the busiest day, never below an hour. */
export function weekScaleMinutes(days: WeekDay[]): number {
  return Math.max(MIN_SCALE_MINUTES, ...days.map((d) => d.totalMinutes));
}

/**
 * Segment heights for one day, as 0-1 fractions of the pillar track, in
 * `day.entries` order.
 *
 * Computed per day rather than per entry because the floor makes them
 * interact: three short sessions each clamped to 12% would overflow a day
 * that only earned 20% of the track, so the set is renormalised whenever it
 * sums past 1. Without that the earliest hobby gets silently clipped.
 */
export function weekBarFractions(day: WeekDay, scaleMinutes: number): number[] {
  if (day.entries.length === 0) return [];

  const raw = day.entries.map((e) =>
    Math.min(1, Math.max(MIN_BAR_FRACTION, scaleMinutes > 0 ? e.minutes / scaleMinutes : 0)),
  );

  const total = raw.reduce((sum, f) => sum + f, 0);
  return total > 1 ? raw.map((f) => f / total) : raw;
}

/* ─── State derivation ───────────────────────────────────────────────────── */

export function deriveVariant(hobbies: DashboardHobby[]): DashboardVariant {
  if (hobbies.length === 0) return "new";

  const active = hobbies.filter((h) => h.status === "active");
  if (active.length === 0) return "all-paused";

  const practised = active
    .map((h) => h.lastSessionDaysAgo)
    .filter((d): d is number => d !== null);

  // Never practised, or nothing in a fortnight — re-entry, not a scoreboard.
  if (practised.length === 0 || Math.min(...practised) > DORMANT_AFTER_DAYS) return "dormant";

  return "active";
}

/** Running, but with no roadmap — what picks the dashed NoRoadmapHobbyCard. */
export function needsRoadmap(hobby: DashboardHobby): boolean {
  return hobby.status === "active" && hobby.stageCount === 0;
}

/**
 * Never practised. Not the same as having no roadmap: a hobby can be mapped
 * out in full and still never touched, and it can be practised for months
 * without one.
 */
export function isNewHobby(hobby: DashboardHobby): boolean {
  return hobby.totalSessions === 0;
}

/**
 * The row that gets the coloured border and the filled button: the at-risk
 * hobby practised most recently. Nothing is suggested once today is logged.
 */
export function pickSuggestedHobbyId(
  hobbies: DashboardHobby[],
  streak: StreakState,
): string | null {
  if (streak.loggedToday) return null;

  const candidates = hobbies
    .filter((h) => h.status === "active")
    .sort((a, b) => (a.lastSessionDaysAgo ?? Infinity) - (b.lastSessionDaysAgo ?? Infinity));

  return candidates[0]?.userHobbyId ?? null;
}

/* ─── Challenges ─────────────────────────────────────────────────────────── */

export interface DashboardChallenge {
  id: string;
  hobbySlug: string;
  hobbyName: string;
  theme: HobbyTheme;
  title: string;
  description: string;
  /** Free text from the challenge row, e.g. "20-30 min". May be empty. */
  estimatedTime: string;
}

/**
 * Live challenges, most urgent (longest-running) first.
 * The left column shows the first and links the rest — see "Unresolved" in
 * docs/frontend/design_handoff_dashboard_refactor/README.md.
 */
export function buildLiveChallenges(
  challenges: Challenge[],
  hobbies: DashboardHobby[],
): DashboardChallenge[] {
  const hobbyBySlug = new Map(hobbies.map((h) => [h.slug, h]));
  const activeSlugs = new Set(hobbies.filter((h) => h.status === "active").map((h) => h.slug));

  return challenges
    .filter((c) => c.status === "active" && activeSlugs.has(c.hobbySlug))
    .sort((a, b) => (a.startedDate ?? "").localeCompare(b.startedDate ?? ""))
    .map((c) => ({
      id: c.id,
      hobbySlug: c.hobbySlug,
      // The hobby's own name, not the challenge's copy of it. A challenge
      // derives its name from the slug, so it would keep saying "Watercolor
      // Painting" after the hobby had been renamed (005).
      hobbyName: hobbyBySlug.get(c.hobbySlug)?.name ?? c.hobbyName,
      theme: hobbyBySlug.get(c.hobbySlug)?.theme ?? "primary",
      title: c.title,
      description: c.description,
      estimatedTime: c.estimatedTime,
    }));
}
