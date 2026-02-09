"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClockIcon, CircleCheckIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { THEME_NEUTRAL, themeFor, type SectionTheme } from "@/lib/sectionTheme";
import {
  isNewHobby,
  lastSessionLabel,
  type DashboardHobby,
  type StageGoal,
} from "@/lib/dashboardHome";
import { fadeUp } from "@/components/ui/animations";

/* Cards, not rows. The single-line row could only ever say *where* a hobby was
   ("Stage 2 of 5 · Wet-on-wet gradients", truncated); the card says what that
   stage actually asks of you. That is the whole reason for the extra height. */

/* No BADGE constant any more. All three cards used to carry a chip top-right —
   STAGE n OF m, NEW, PAUSED — and all three gave that slot to their action:
   the stage chip duplicated the segmented bar, and the other two restated the
   card's own callout and colouring. */
const CARD_BASE =
  "relative flex flex-col gap-3 rounded-2xl p-[15px] transition-colors duration-200";

/** The hobby's name — the thing you scan a column for, so it leads its row. */
const CARD_TITLE = "min-w-0 flex-1 truncate text-base font-bold";


/**
 * Trims the action down from Button's `sm` (px-4 py-2 text-sm).
 *
 * Applied as inline style rather than utility classes: Tailwind resolves
 * `px-3` against `px-4` by CSS order, not by the order they appear in the
 * class string, so overriding a size that way is a coin toss.
 *
 * The point is weight, not space. At `sm` the button out-weighed the name
 * beside it, which inverts what the card is for — the name identifies it, the
 * button acts on it.
 */
export const COMPACT_ACTION = { paddingInline: 12, paddingBlock: 6, fontSize: "12.5px" } as const;

/**
 * Volume, to sit opposite recency in the footer.
 *
 * No icon: the clock on the left already marks the row as history, and a bare
 * number reads as a tally without one. It is the only fact the card does not
 * state elsewhere — the stage is in the bar, the goals are in the checklist —
 * and it separates an established hobby from one poked twice and abandoned.
 */
function SessionTally({ count }: { count: number }) {
  return (
    <span className="flex-shrink-0 text-[10.5px] text-[#6b7280]">
      {count} session{count === 1 ? "" : "s"}
    </span>
  );
}

/** Footer timestamp — the clock marks it as "when", not another status word. */
function TimeMeta({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] text-[#6b7280]">
      <ClockIcon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Shipped checklist geometry. Tune on `/preview/hobby-card`, then change here. */
const CHECKLIST_PAD_TOP = "12px";
const CHECKLIST_PAD_BOTTOM = "12px";
/** Goal text. `leading-[1.45]` is unitless, so it tracks this on its own. */
const CHECKLIST_TEXT_SIZE = "12px";
/** The "Focus: …" line, on both the active and paused cards. */
const FOCUS_TEXT_SIZE = "12.5px";
/**
 * How far short of the card edge a truncated line stops.
 *
 * Without it every clipped line ran to the same x and the card read as a slab
 * of text with a column of ellipses down its right edge. The gutter gives the
 * block a margin to breathe into and makes the "…" look chosen rather than
 * jammed against the wall.
 */
const TRUNCATE_GUTTER = "28px";

/** The name clips against its own gutter, not against the button beside it. */
const TITLE_STYLE = { paddingRight: `var(--truncate-gutter, ${TRUNCATE_GUTTER})` } as const;

interface ChecklistProps {
  goals: StageGoal[];
  theme: SectionTheme;
  /** Paused register — the box takes the theme's own fill instead of white. */
  muted?: boolean;
  /** Where a row goes. Omitted renders the list inert (paused cards, previews). */
  href?: string;
}

/**
 * The mockup's mini checklist, backed by `user_roadmaps.completed_goals`
 * (migration 004): ticked items strike through, the rest stay open circles.
 *
 * **A read-out, not a control.** Ticking here used to write straight through,
 * which put the one gesture that now advances a phase on a card with none of
 * the context for it — no phase title, no progress, no sight of what comes
 * next, and three goals of a five-goal phase on screen. Emptying a checklist
 * you cannot see the end of would advance the roadmap by surprise.
 *
 * So a row goes to the roadmap instead, where the same tick is made in front of
 * the phase it completes. Each is a link above the card's stretched one, so it
 * beats the card's own destination rather than being swallowed by it.
 */
function Checklist({ goals, theme, muted = false, href }: ChecklistProps) {
  if (goals.length === 0) return null;

  return (
    <div
      className="rounded-xl border px-2.5"
      /* Vertical padding via CSS vars, same tuning seam as StageBar. The
         fallbacks ship; the vars only exist for /preview/hobby-card. */
      style={{
        paddingTop: `var(--checklist-pad-top, ${CHECKLIST_PAD_TOP})`,
        paddingBottom: `var(--checklist-pad-bottom, ${CHECKLIST_PAD_BOTTOM})`,
        // §2.3: an interactive surface on a tinted card is white. A paused card
        // takes its own fill instead, so nothing on it is brighter than it is.
        backgroundColor: muted ? theme.light : "rgba(255,255,255,0.7)",
        borderColor: muted ? theme.border : "rgba(255,255,255,0.7)",
      }}
    >
      <ul className="flex flex-col gap-1.5">
        {goals.map((goal) => {
          const rowClass = `relative z-10 flex w-full items-start gap-2 text-left no-underline ${
            href ? "cursor-pointer" : "cursor-default"
          }`;

          const row = (
            <>
              {/* Ticked and open state are the same circle at the same size, so
                  the list does not shift when an item is checked. */}
              {goal.done ? (
                <CircleCheckIcon
                  className="mt-[1px] h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: theme.accent }}
                />
              ) : (
                <span
                  className="mt-[1px] h-3.5 w-3.5 flex-shrink-0 rounded-full border-[1.5px]"
                  style={{ borderColor: theme.accent }}
                />
              )}
              {/* One line, clipped. `min-w-0` is what lets it: without it a
                  flex child refuses to shrink below its content, so the text
                  pushes the row wider instead of ellipsing. */}
              <span
                className={`min-w-0 truncate leading-[1.45] ${
                  goal.done ? "line-through opacity-70" : ""
                } ${muted ? "" : "font-medium"}`}
                style={{
                  fontSize: `var(--checklist-text-size, ${CHECKLIST_TEXT_SIZE})`,
                  paddingRight: `var(--truncate-gutter, ${TRUNCATE_GUTTER})`,
                  color: muted ? theme.accent : "#4b5563",
                }}
              >
                {goal.text}
              </span>
            </>
          );

          return (
            <li key={goal.key}>
              {href ? (
                <Link href={href} className={rowClass}>
                  {row}
                </Link>
              ) : (
                <div className={rowClass}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** "yesterday" → "Yesterday". Footer timestamps open a line in the mockup. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Shipped stage-bar geometry. Tune on `/preview/hobby-card`, then change here. */
const STAGE_BAR_HEIGHT = "8px";
const STAGE_BAR_GAP = "6px";

interface StageBarProps {
  stage: number;
  stageCount: number;
  /** A stage already reached. */
  fill: string;
  /** A stage still ahead. */
  track: string;
}

/**
 * One pill per roadmap stage, filled up to the current one.
 *
 * This says exactly what the old bar said — its width was only ever
 * `stage / stageCount` — but a continuous bar reads as progress *within* a
 * stage, which nothing in the app tracks. Segments can only be counted, so
 * they agree with the "Stage 2 of 5" badge instead of implying a finer
 * measurement that does not exist.
 */
function StageBar({ stage, stageCount, fill, track }: StageBarProps) {
  return (
    <div
      className="flex items-center"
      role="img"
      aria-label={`Stage ${stage} of ${stageCount}`}
      /* Geometry via CSS vars so it can be tuned per-subtree without a prop on
         every card — /preview/hobby-card sets them on a wrapper. The fallbacks
         are the shipped values; change those, not the vars. */
      style={{ gap: `var(--stage-bar-gap, ${STAGE_BAR_GAP})` }}
    >
      {Array.from({ length: stageCount }, (_, i) => (
        <span
          key={i}
          className="flex-1 rounded-full transition-colors duration-500"
          style={{
            height: `var(--stage-bar-height, ${STAGE_BAR_HEIGHT})`,
            background: i < stage ? fill : track,
          }}
        />
      ))}
    </div>
  );
}

interface RoadmapCalloutProps {
  slug: string;
  generating?: boolean;
  error?: string;
  onGenerate: (slug: string) => void;
  /** The hobby's own quad, so the callout joins the blue/lime alternation. */
  theme: SectionTheme;
  /** Paused register: greys, whatever the hobby's theme is. */
  muted?: boolean;
}

/**
 * The offer to build a roadmap, for any card that has not got one — new,
 * active, or paused. A hobby without a roadmap has the same next step whatever
 * its status, so the offer travels with the absence rather than with the card
 * that first happened to show it.
 *
 * Muted on a paused card: colour is what marks a hobby as running (§2.2), and
 * a filled blue CTA inside a grey card would read as the loudest thing on a
 * shelved hobby. The action stays plainly clickable, it just stops shouting.
 */
function RoadmapCallout({
  slug,
  generating,
  error,
  onGenerate,
  theme,
  muted,
}: RoadmapCalloutProps) {
  // Paused passes THEME_NEUTRAL, so one set of theme lookups covers both.
  const shellBg = muted ? theme.bg : "rgba(255,255,255,0.7)";

  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: theme.border, backgroundColor: shellBg }}
    >
      {/* One layout for all three states. Generating and failing used to
          replace the whole callout, so the card changed shape twice on the way
          to a roadmap; now only the button changes and everything above it
          holds still. */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-[1px] flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: theme.light }}
          >
            <MapIcon size={13} style={{ color: theme.accent }} />
          </span>
          <div className="min-w-0">
            <p
              className="text-[12.5px] font-bold"
              style={{ color: muted ? theme.accent : "var(--foreground)" }}
            >
              No Learning Roadmap
            </p>
            <p
              className="mt-0.5 text-[11px] leading-[1.5]"
              style={{ color: muted ? theme.accent : "#6b7280" }}
            >
              Break down this hobby into 4-5 structured practice stages with custom checklists.
            </p>
          </div>
        </div>

        {/* The ghost-filled block from §5.3, matching EmptyVideoState's
            "search YouTube instead": tinted fill, soft themed border, strong
            themed text. `noScaleOnHover` because a full-width button growing
            5% inside a bordered box pushes past its own container — shadow and
            the press are enough feedback. */}
        <Button
          variant="outline"
          outlineColor={theme.border}
          outlineHoverColor={theme.accent}
          size="sm"
          fullWidth
          noScaleOnHover
          disabled={generating}
          onClick={() => onGenerate(slug)}
          className="relative z-10 transition-all hover:shadow-lg"
          style={{
            fontSize: COMPACT_ACTION.fontSize,
            backgroundColor: theme.light,
            color: theme.accent,
          }}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              {/* The inline spinner, not FlowerSpinner — §7.4 reserves the
                  flower for page-level waits and gives buttons this one. It is
                  indeterminate on purpose: the roadmap crew is a single task
                  whose status endpoint reports no progress, so a bar would
                  lie. */}
              <Spinner size="xs" variant={muted ? "subtle" : "default"} />
              Building your roadmap
            </span>
          ) : error ? (
            "Something went wrong — try again"
          ) : (
            "Generate One"
          )}
        </Button>
      </div>
    </div>
  );
}

interface HobbyCardProps {
  hobby: DashboardHobby;
  index?: number;
  onLog: (slug: string) => void;
}

/**
 * The whole card is the link to the hobby; "Log session" is the only button and
 * sits above the stretched link. There is deliberately no chevron — a text
 * action competing with a chevron target was the ambiguity 3a set out to fix.
 *
 * Every card is tinted in its own theme, alternating blue/lime down the list —
 * the quiz-card system from §2.2, applied here. `QuizCard.tsx:53` pairs
 * `theme.bg` with `theme.border` (the soft one, not `accent`), which is what
 * this follows; §5.3's text says `accent`, but the quiz is the reference
 * surface and the softer edge is what it actually ships.
 *
 * Every card gets the identical treatment — `theme.bg` fill, `theme.accent`
 * border, and a solid button in the same accent. There is no "suggested" card
 * any more: singling one out meant the rhythm existed but was never visible,
 * since one coloured card among white ones reads as an alert rather than a
 * system. What to do today is named by the greeting and the challenge card,
 * which say it in words.
 */
export function HobbyCard({ hobby, index = 0, onLog }: HobbyCardProps) {
  const theme = themeFor(hobby.theme);
  const goals = hobby.stageGoals;
  const roadmapHref = `/dashboard/hobby/${hobby.slug}#roadmap`;

  /* Button.variant "primary" is --primary, "secondary" is --secondary, and
     the lime one already pairs itself with dark text — the same problem
     `textOnAccent` exists to solve. So the hobby's theme picks the variant
     rather than any colour being written here. */
  const logButton = (
    <Button
      variant={hobby.theme === "primary" ? "primary" : "secondary"}
      size="sm"
      onClick={() => onLog(hobby.slug)}
      className="relative z-10 flex-shrink-0"
      style={COMPACT_ACTION}
    >
      {isNewHobby(hobby) ? "Log First Session" : "Log Session"}
    </Button>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`${CARD_BASE} border-[1.5px]`}
      style={{ backgroundColor: theme.bg, borderColor: theme.accent }}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      {/* ROW 1 — name and the one action. A "Stage 2 of 5" badge used to sit
          here; once the bar below became segmented the two said the identical
          thing, so the slot went to the action instead. */}
      {/* items-center, not items-start: the name is `truncate`, so it can never
          run to a second line — aligning to the top only parks it above the
          button's centre on every card. */}
      <div className="flex items-center justify-between gap-2.5">
        <p className={`${CARD_TITLE} text-[var(--foreground)]`} style={TITLE_STYLE}>
          {hobby.name}
        </p>
        {logButton}
      </div>

      {/* ROW 2 — what the stage is, how far in, and what it covers */}
      <div className="flex flex-col gap-2">
        {/* 12.5px, matching the roadmap callout's heading — the two occupy the
            same slot across card types, so they should carry the same weight
            in the column. */}
        {hobby.stageLabel && (
          <p
            className="truncate font-semibold text-[var(--foreground)]"
            style={{
              fontSize: `var(--focus-text-size, ${FOCUS_TEXT_SIZE})`,
              paddingRight: `var(--truncate-gutter, ${TRUNCATE_GUTTER})`,
            }}
          >
            Focus: {hobby.stageLabel}
          </p>
        )}

        {/* The stage bar and the checklist both go to the roadmap; everything
            else on the card falls through to the stretched link and opens the
            hobby page at the top. Both are about the phase you are on, so both
            lead to where that phase is managed. */}
        <Link
          href={roadmapHref}
          aria-label={`Open the roadmap for ${hobby.name}`}
          className="relative z-10 block"
        >
          <StageBar
            stage={hobby.stage}
            stageCount={hobby.stageCount}
            fill={theme.accent}
            track={theme.border}
          />
        </Link>

        <Checklist goals={goals} theme={theme} href={roadmapHref} />
      </div>

      {/* ROW 3 — pure history: how recently, and how much. Everything above it
          points forward, which is what makes the split worth a row. */}
      <div className="flex items-center justify-between gap-3">
        <TimeMeta>{capitalise(lastSessionLabel(hobby.lastSessionDaysAgo))}</TimeMeta>
        <SessionTally count={hobby.totalSessions} />
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
  const theme = themeFor(hobby.theme);
  const addedLabel = hobby.addedDaysAgo <= 1 ? "Added today" : `Added ${hobby.addedDaysAgo} days ago`;

  /* Solid in the hobby's own accent, same as every other card's action —
     see the note on HobbyCard's logButton. */
  const logButton = (
    <Button
      variant={hobby.theme === "primary" ? "primary" : "secondary"}
      size="sm"
      onClick={() => onLog(hobby.slug)}
      className="relative z-10 flex-shrink-0"
      style={COMPACT_ACTION}
    >
      {isNewHobby(hobby) ? "Log First Session" : "Log Session"}
    </Button>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      /* Dashed in the hobby's own theme, not always blue — the card joins the
         alternation like every other; the dashed edge is what says "not built
         yet", not the colour. */
      className={`${CARD_BASE} border-[1.5px] border-dashed`}
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      <div className="flex items-center justify-between gap-2.5">
        <p className={`${CARD_TITLE} text-[var(--foreground)]`} style={TITLE_STYLE}>
          {hobby.name}
        </p>
        {/* A "New" badge used to sit here. The callout below says what is
            missing in a whole sentence, and the "New" filter chip is what
            groups these cards — the badge was restating both. */}
        {logButton}
      </div>

      {/* Nothing between the title and the callout. A progress bar with no
          stages, a goal line, and a "No activity yet" note were three ways of
          restating what the NEW chip and "Added today" already say. */}
      <RoadmapCallout
        slug={hobby.slug}
        theme={theme}
        generating={generating}
        error={error}
        onGenerate={onGenerate}
      />

      {/* The same history row every other card carries, zero included. It was
          withheld at zero for a while on the grounds that "0 sessions" is "No
          activity yet" in disguise — but an active hobby that has never been
          logged shows it, so suppressing it here only made two cards disagree
          about the same fact. A tally reads as a count, not a reproach. */}
      <div className="flex items-center justify-between gap-3">
        <TimeMeta>{addedLabel}</TimeMeta>
        <SessionTally count={hobby.totalSessions} />
      </div>
    </motion.div>
  );
}

interface PausedHobbyCardProps {
  hobby: DashboardHobby;
  /** Footer timestamp — "Paused Aug 1", or the last practice pre-004. */
  meta: string;
  index?: number;
  resuming?: boolean;
  /** Set while the cap leaves no room: disables Resume and says why. */
  blockedReason?: string;
  /** Why the last resume was refused, for anything the cap did not catch. */
  error?: string;
  /** Replaces the built-in Resume button. The dashboard passes a cap-aware one
   *  that opens the shared notice; omit it to get the plain button, which is
   *  what previews and any other caller want. */
  resumeAction?: ReactNode;
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
  index = 0,
  resuming = false,
  blockedReason,
  error,
  resumeAction,
  onResume,
}: PausedHobbyCardProps) {
  const goals = hobby.stageGoals;
  const [blocked, setBlocked] = useState(false);
  const theme = THEME_NEUTRAL;

  // Solid like every other card's action, but in the neutral accent: colour
  // marks a hobby as running.
  /* Genuinely disabled at the cap rather than clickable-and-refused: the card
     has room to say why without being asked, so the click would only fire a
     request the server is already known to reject. */
  const resumeButton = resumeAction ?? (
    <Button
      variant="primary"
      size="sm"
      disabled={resuming || Boolean(blockedReason)}
      onClick={() => onResume(hobby.userHobbyId)}
      className="relative z-10 flex-shrink-0"
      style={{ ...COMPACT_ACTION, backgroundColor: theme.accent, color: theme.textOnAccent }}
    >
      {resuming ? "Resuming…" : "Resume Hobby"}
    </Button>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`${CARD_BASE} border-[1.5px]`}
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <Link
        href={`/dashboard/hobby/${hobby.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Open ${hobby.name}`}
      />

      <div className="flex items-center justify-between gap-2.5">
        <p className={CARD_TITLE} style={{ ...TITLE_STYLE, color: theme.accent }}>
          {hobby.name}
        </p>
        {/* A PAUSED chip used to sit here. The greys and the word "Resume" say
            it between them, and the footer gives the date it happened. */}
        {resumeButton}
      </div>


      {/* Everything a live card shows, in greys rather than the hobby's theme —
          the colour is what marks a hobby as running, so it is the one thing
          that is withheld. */}
      {hobby.stageCount > 0 ? (
        <div className="flex flex-col gap-2">
          {hobby.stageLabel && (
            <p
              className="truncate font-semibold"
              style={{
                fontSize: `var(--focus-text-size, ${FOCUS_TEXT_SIZE})`,
                paddingRight: `var(--truncate-gutter, ${TRUNCATE_GUTTER})`,
                color: theme.accent,
              }}
            >
              Focus: {hobby.stageLabel}
            </p>
          )}

          <StageBar
            stage={hobby.stage}
            stageCount={hobby.stageCount}
            fill={theme.accent}
            track={theme.border}
          />

          <Checklist goals={goals} theme={theme} muted />
        </div>
      ) : (
        /* Shelved before a roadmap was ever built. The callout shows so the
           card is not a name above an empty footer, but generating from here
           is refused — the button explains why instead of doing it. */
        <RoadmapCallout muted slug={hobby.slug} theme={theme} onGenerate={() => setBlocked(true)} />
      )}

      {/* No rule above it, matching the other two cards. The mockup ruled this
          footer off from the body back when the paused card was the only one
          that had a footer; now all three do, and only this one being divided
          read as an accident. */}
      {/* Above the footer, inside the card's own stacking context so the
          full-card link does not sit on top of it. */}
      {(blockedReason ?? error) && (
        <p className="relative z-10 rounded-xl border border-yellow-300 bg-yellow-50 p-2 text-[12px] leading-relaxed text-yellow-800">
          {blockedReason ?? error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <TimeMeta>{meta}</TimeMeta>
        <SessionTally count={hobby.totalSessions} />
      </div>

      <ConfirmDialog
        isOpen={blocked}
        title={`${hobby.name} is paused`}
        message="Paused hobbies are on hold — resume it first to build a roadmap or log a session."
        confirmLabel="Resume hobby"
        cancelLabel="Keep it paused"
        onConfirm={() => {
          setBlocked(false);
          onResume(hobby.userHobbyId);
        }}
        onCancel={() => setBlocked(false)}
      />
    </motion.div>
  );
}

/*
 * There is no paused-hobbies disclosure any more. Paused hobbies sit in the
 * list with the active ones, carrying a PAUSED badge and a Resume button —
 * hiding them behind a toggle meant a hobby you'd shelved was also out of
 * mind. The "Paused" filter chip is what shortens the column now.
 */
