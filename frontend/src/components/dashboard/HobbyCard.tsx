"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClockIcon, CircleCheckIcon } from "@/components/ui/Icons";
import { FlowerSpinner } from "@/components/ui/FlowerSpinner";
import { themeFor } from "@/lib/sectionTheme";
import { lastSessionLabel, type DashboardHobby, type StageGoal } from "@/lib/dashboardHome";
import { fadeUp } from "@/components/ui/animations";

/* Cards, not rows. The single-line row could only ever say *where* a hobby was
   ("Stage 2 of 5 · Wet-on-wet gradients", truncated); the card says what that
   stage actually asks of you. That is the whole reason for the extra height. */

const CARD_BASE =
  "relative flex flex-col gap-3 rounded-2xl p-[15px] transition-colors duration-200";
const BADGE = "flex-shrink-0 rounded-md px-2 py-[3px] text-[10px] font-bold tracking-wider";

/** Footer timestamp — the clock marks it as "when", not another status word. */
function TimeMeta({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] text-[#6b7280]">
      <ClockIcon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

interface ChecklistProps {
  goals: StageGoal[];
  /** Accent for the next unticked item. Omitted on paused cards. */
  accent?: string;
  muted?: boolean;
  onToggle?: (goalKey: string) => void;
}

/**
 * The mockup's mini checklist, backed by `user_roadmaps.completed_goals`
 * (migration 004): ticked items strike through, the rest stay open circles.
 *
 * Each row is a real button sitting above the card's stretched link, so
 * ticking an item never navigates.
 */
function Checklist({ goals, accent, muted = false, onToggle }: ChecklistProps) {
  if (goals.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-2.5 ${
        muted ? "border-[var(--white-soft)] bg-white/60" : "border-[var(--white-muted)] bg-[var(--white-muted)]/50"
      }`}
    >
      <ul className="flex flex-col gap-1.5">
        {goals.map((goal) => (
          <li key={goal.key}>
            <button
              type="button"
              disabled={!onToggle}
              aria-pressed={goal.done}
              onClick={() => onToggle?.(goal.key)}
              className={`relative z-10 flex w-full items-start gap-2 text-left ${
                onToggle ? "cursor-pointer active:scale-95" : "cursor-default"
              }`}
            >
              {/* Ticked and open state are the same circle at the same size, so
                  the list does not shift when an item is checked. */}
              {goal.done ? (
                <CircleCheckIcon className="mt-[1px] h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
              ) : (
                <span
                  className="mt-[1px] h-3.5 w-3.5 flex-shrink-0 rounded-full border-[1.5px]"
                  style={{ borderColor: muted ? "#c4bdb5" : (accent ?? "#c4bdb5") }}
                />
              )}
              <span
                className={`text-[11.5px] leading-[1.45] ${
                  goal.done
                    ? "text-[#b0aaa3] line-through"
                    : muted
                      ? "text-[#9ca3af]"
                      : "font-medium text-[#4b5563]"
                }`}
              >
                {goal.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Badge text on a `theme.light` fill. Lime cannot be its own text colour — it
 * is barely darker than its own tint, the same reason §2.2 gives lime a dark
 * `textOnAccent`. Blue has the contrast to carry it.
 */
function badgeTextColor(theme: DashboardHobby["theme"]): string {
  return theme === "secondary" ? "var(--foreground)" : "var(--primary-theme-accent)";
}

/** "yesterday" → "Yesterday". Footer timestamps open a line in the mockup. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface HobbyCardProps {
  hobby: DashboardHobby;
  /** The at-risk card: tinted, coloured border, filled button. At most one per page. */
  suggested?: boolean;
  index?: number;
  onLog: (slug: string) => void;
  onToggleGoal?: (userRoadmapId: string, goalKey: string) => void;
}

/**
 * The whole card is the link to the hobby; "Log session" is the only button and
 * sits above the stretched link. There is deliberately no chevron — a text
 * action competing with a chevron target was the ambiguity 3a set out to fix.
 *
 * The suggested card is *tinted*, not just outlined. A 1.5px pale-blue border on
 * white was the page's only answer to "what should I do today?" and it was
 * invisible; a filled card in the hobby's own theme is both the loudest thing
 * in the column and the only place the blue/lime rhythm reads at a glance.
 */
export function HobbyCard({
  hobby,
  suggested = false,
  index = 0,
  onLog,
  onToggleGoal,
}: HobbyCardProps) {
  const theme = themeFor(hobby.theme);
  const goals = hobby.stageGoals;

  const toggle =
    onToggleGoal && hobby.userRoadmapId
      ? (goalKey: string) => onToggleGoal(hobby.userRoadmapId, goalKey)
      : undefined;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`${CARD_BASE} ${
        suggested
          ? "border-[1.5px]"
          : "border border-[var(--white-muted)] bg-white hover:border-[var(--primary-lighter)]"
      }`}
      style={suggested ? { backgroundColor: theme.bg, borderColor: theme.accent } : undefined}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      {/* ROW 1 — name + where you are */}
      <div className="flex items-start justify-between gap-2.5">
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[var(--foreground)]">
          {hobby.name}
        </p>
        <span
          className={BADGE}
          style={{ backgroundColor: theme.light, color: badgeTextColor(hobby.theme) }}
        >
          STAGE {hobby.stage} OF {hobby.stageCount}
        </span>
      </div>

      {/* ROW 2 — what the stage is, how far in, and what it covers */}
      <div className="flex flex-col gap-2">
        {hobby.stageLabel && (
          <p className="truncate text-[11.5px] text-[#6b7280]">
            Focus: <span className="font-semibold text-[var(--foreground)]">{hobby.stageLabel}</span>
          </p>
        )}

        <div
          className="h-1.5 overflow-hidden rounded-sm"
          style={{ background: suggested ? theme.border : theme.bg }}
        >
          <div
            className="h-full rounded-sm transition-[width] duration-500"
            style={{ width: `${hobby.stageProgress}%`, background: theme.accent }}
          />
        </div>

        <Checklist goals={goals} accent={theme.accent} onToggle={toggle} />
      </div>

      {/* ROW 3 — history left, the one action right */}
      <div className="flex items-center justify-between gap-3">
        <TimeMeta>{capitalise(lastSessionLabel(hobby.lastSessionDaysAgo))}</TimeMeta>
        <Button
          variant={suggested ? "primary" : "outline"}
          size="sm"
          outlineColor="#d1d5db"
          outlineHoverColor="#6b7280"
          onClick={() => onLog(hobby.slug)}
          className="relative z-10 flex-shrink-0"
        >
          Log Session
        </Button>
      </div>
    </motion.div>
  );
}

interface NoRoadmapHobbyCardProps {
  hobby: DashboardHobby;
  index?: number;
  generating?: boolean;
  error?: string;
  onGenerate: (slug: string) => void;
  onLog: (slug: string) => void;
}

/**
 * A hobby added from the dashboard lands with no roadmap — AddHobbyModal only
 * calls addCustomHobby. The row's previous answer was the grey dead-end
 * "No roadmap yet — open the hobby to build one", which asked the user to
 * navigate before they could act. The build starts from here instead.
 */
export function NoRoadmapHobbyCard({
  hobby,
  index = 0,
  generating = false,
  error,
  onGenerate,
  onLog,
}: NoRoadmapHobbyCardProps) {
  const addedLabel = hobby.addedDaysAgo <= 1 ? "Added today" : `Added ${hobby.addedDaysAgo} days ago`;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`${CARD_BASE} border-[1.5px] border-dashed border-[var(--primary-lighter)] bg-[var(--primary-theme-bg)] hover:border-[var(--primary)]`}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      <div className="flex items-start justify-between gap-2.5">
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[var(--foreground)]">
          {hobby.name}
        </p>
        {/* "New", not "No roadmap" — it matches the filter chip that selects
            these cards, and the callout below already says what's missing. */}
        <span
          className={BADGE}
          style={{
            backgroundColor: "var(--primary-theme-light)",
            color: "var(--primary-theme-accent)",
          }}
        >
          NEW
        </span>
      </div>

      {/* Nothing between the title and the callout. A progress bar with no
          stages, a goal line, and a "No activity yet" note were three ways of
          restating what the NEW chip and "Added today" already say. */}
      <div className="rounded-xl border border-[var(--primary-lighter)] bg-white/80 p-3">
        {generating ? (
          <div className="flex items-center gap-3">
            <FlowerSpinner size={34} color="var(--primary)" innerColor="var(--secondary)" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-[var(--foreground)]">
                Building your roadmap
              </p>
              {/* Indeterminate on purpose — the roadmap crew is a single task and
                  its status endpoint reports no progress, so a bar would lie. */}
              <p className="mt-0.5 text-[11px] leading-[1.5] text-[#6b7280]">
                This takes about a minute. Feel free to carry on.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-[1px] flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-theme-light)]">
                <MapIcon size={13} className="text-[var(--primary)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-[var(--foreground)]">
                  No Learning Roadmap Generated
                </p>
                <p className="mt-0.5 text-[11px] leading-[1.5] text-[#6b7280]">
                  Break down this hobby into 4-5 structured practice stages with custom checklists.
                </p>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-yellow-300 bg-yellow-50 p-2 text-[11px] leading-[1.5] text-yellow-800">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => onGenerate(hobby.slug)}
              className="relative z-10"
            >
              {error ? "Try Again" : "Generate AI Learning Roadmap"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <TimeMeta>{addedLabel}</TimeMeta>
        <Button
          variant="outline"
          size="sm"
          outlineColor="#d1d5db"
          outlineHoverColor="#6b7280"
          onClick={() => onLog(hobby.slug)}
          className="relative z-10 flex-shrink-0"
        >
          {hobby.totalSessions === 0 ? "Log First Session" : "Log Session"}
        </Button>
      </div>
    </motion.div>
  );
}

interface PausedHobbyCardProps {
  hobby: DashboardHobby;
  /** Meta line — differs between the mixed list and the all-paused column. */
  meta: string;
  /**
   * Whether `meta` is a timestamp. The all-paused column passes a session
   * tally instead ("3 sessions · longest streak 5 days"), which a clock would
   * mislabel.
   */
  metaIsTime?: boolean;
  /** Primary on the strongest candidate to resume, outline on the rest. */
  emphasised?: boolean;
  index?: number;
  resuming?: boolean;
  onResume: (userHobbyId: string) => void;
}

/**
 * Same skeleton, greyed down, with Resume as the single action.
 *
 * Pausing is not the same as starting over, so the card keeps the roadmap
 * detail it has — stage, focus, progress, the goals of the stage you stopped
 * on. Dropping it made every paused hobby look like a blank slate and hid the
 * one fact most likely to get someone back: how far they already got.
 */
export function PausedHobbyCard({
  hobby,
  meta,
  metaIsTime = true,
  emphasised = false,
  index = 0,
  resuming = false,
  onResume,
}: PausedHobbyCardProps) {
  const goals = hobby.stageGoals;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`${CARD_BASE} border border-[var(--white-muted)] bg-[#fbfaf8] hover:border-[var(--white-dim)]`}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      <div className="flex items-start justify-between gap-2.5">
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#6b7280]">{hobby.name}</p>
        {/* One chip per card. PAUSED is the fact that changes what you can do
            here; the stage is still legible from the focus line and the bar. */}
        <span className={`${BADGE} bg-[var(--white-soft)] text-[#6b7280]`}>PAUSED</span>
      </div>

      {/* Everything a live card shows, in greys rather than the hobby's theme —
          the colour is what marks a hobby as running, so it is the one thing
          that is withheld. */}
      {hobby.stageCount > 0 && (
        <div className="flex flex-col gap-2">
          {hobby.stageLabel && (
            <p className="truncate text-[11.5px] text-[#9ca3af]">
              Focus: <span className="font-semibold text-[#6b7280]">{hobby.stageLabel}</span>
            </p>
          )}

          <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--white-soft)]">
            <div
              className="h-full rounded-sm bg-[#b6afa7]"
              style={{ width: `${hobby.stageProgress}%` }}
            />
          </div>

          <Checklist goals={goals} muted />
        </div>
      )}

      {/* The mockup rules this footer off from the body. */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--white-soft)] pt-2.5">
        {metaIsTime ? (
          <TimeMeta>{meta}</TimeMeta>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[10.5px] text-[#6b7280]">{meta}</span>
        )}
        <Button
          variant={emphasised ? "primary" : "outline"}
          size="sm"
          outlineColor="#d1d5db"
          outlineHoverColor="#6b7280"
          disabled={resuming}
          onClick={() => onResume(hobby.userHobbyId)}
          className="relative z-10 flex-shrink-0"
        >
          {resuming ? "Resuming…" : "Resume Hobby"}
        </Button>
      </div>
    </motion.div>
  );
}

/*
 * There is no paused-hobbies disclosure any more. Paused hobbies sit in the
 * list with the active ones, carrying a PAUSED badge and a Resume button —
 * hiding them behind a toggle meant a hobby you'd shelved was also out of
 * mind. The "Paused" filter chip is what shortens the column now.
 */
