"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CAP_MESSAGE, MAX_ACTIVE_HOBBIES } from "@/lib/hobbyLimits";
import { useDismissable } from "@/lib/hooks/useDismissable";
import { THEME_NEUTRAL } from "@/lib/sectionTheme";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { HobbyCard, NoRoadmapHobbyCard, PausedHobbyCard, COMPACT_ACTION } from "./HobbyCard";
import { PracticeWeek } from "./PracticeWeek";
import { FocusTimerCard } from "./FocusTimerCard";
import { ActiveChallengeCard, RetakeQuizCard } from "./DashboardCards";
import { Greeting, type NudgeView } from "./Greeting";
import {
  needsRoadmap,
  lastSessionLabel,
  pausedOnLabel,
  type DashboardChallenge,
  type DashboardHobby,
  type DashboardVariant,
  type StreakState,
  type WeekDay,
} from "@/lib/dashboardHome";
import { fadeUp } from "@/components/ui/animations";

export type { NudgeView };

export interface DashboardHomeProps {
  variant: DashboardVariant;
  firstName: string;
  streak: StreakState;
  hobbies: DashboardHobby[];
  week: WeekDay[];
  /** Live challenges, most urgent first. Only the first gets a card. */
  challenges: DashboardChallenge[];
  suggestedHobbyId: string | null;
  resumingHobbyId?: string | null;
  /** Hobbies with a roadmap build in flight — see useRoadmapGeneration. */
  generatingSlugs?: Set<string>;
  /** Slug → message for roadmap builds that failed. */
  roadmapErrors?: Record<string, string>;
  /** Hobbies with a challenge build in flight. */
  generatingChallengeSlugs?: Set<string>;
  /** Slug → message for challenge builds that failed. */
  challengeErrors?: Record<string, string>;
  /** Build a challenge for one hobby. Omitted hides the offer (previews). */
  onGenerateChallenge?: (hobbySlug: string) => void;
  /** Called with no slug for the header button: the modal then asks which hobby. */
  onLog: (slug?: string) => void;
  onAddHobby: () => void;
  onResume: (userHobbyId: string) => void;
  /** Shelve a running hobby. Omitted in read-only previews, which hides the
   *  pause list inside the cap popover. */
  onPause?: (userHobbyId: string) => void;
  /** The hobby with a pause in flight, if any. */
  pausingHobbyId?: string | null;
  /** userHobbyId → why a resume was refused. The cap is the only reason. */
  resumeErrors?: Record<string, string>;
  onGenerateRoadmap: (slug: string) => void;
  /** Fired when the focus timer runs out. Omitting it hides the timer card. */
  onTimerComplete?: (hobbySlug: string, minutes: number) => void;
  /** The motivation line, when there is one — it replaces the greeting's
   *  second line. See `deriveNudge`. */
  nudge?: NudgeView | null;
  /** Opens a challenge in the modal the page owns. */
  onOpenChallenge?: (challengeId: string) => void;
}

/*
 * The steady-state sections carry no label. "Active challenge", "Your hobbies"
 * and "Practice this week" each named something already unmistakable — a dark
 * card with its own eyebrow, a column of hobby cards, a seven-day strip — so
 * they were three lines of uppercase telling you what you could already see.
 *
 * What survives is the framing for the two states where the card *isn't*
 * self-evident: the re-entry card and the retake-quiz card, which need saying
 * why they are there.
 */
const SECTION_LABEL =
  "text-[11.5px] font-bold uppercase tracking-widest text-[var(--foreground)]";

/**
 * "Compact Command" — the dashboard home, all four states.
 *
 * Which state renders is derived upstream and passed as `variant`; this
 * component never fetches. The real page and /preview/pages/dashboard both
 * render it, which is what keeps the preview honest.
 *
 * The left rail from the design handoff is deliberately absent, and the app's
 * own sidebar is gone too: AppShell is one header row over a two-page app.
 */
export function DashboardHome(props: DashboardHomeProps) {
  const { variant, firstName, streak, hobbies, onLog } = props;

  const active = hobbies.filter((h) => h.status === "active");
  const paused = hobbies.filter((h) => h.status === "paused");


  if (variant === "new") return <NewUserEmptyState />;

  return (
    /* No page header. It carried only the weekday, which now rides above the
       greeting as an eyebrow — a 56px bordered band was a lot of chrome for one
       word. Without it there is nothing to run edge to edge, so AppShell's
       own <main> padding is left alone rather than cancelled and re-added. */
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <Greeting
          variant={variant}
          firstName={firstName}
          hobbies={active}
          streak={streak}
          nudge={props.nudge}
        />

        {/* Mobile only. It guesses nothing — the modal opens with no hobby
            chosen — which makes it strictly more work than any card's own
            pre-filled button, and on desktop every card is a glance away. On a
            phone the hobby list sits below the whole focus column, so this is
            the one path to logging that does not start with a scroll.
            Still no FAB. */}
        <Button
          size="sm"
          variant="outline"
          outlineColor="#d1d5db"
          outlineHoverColor="#6b7280"
          onClick={() => onLog()}
          className="lg:hidden"
        >
          Log Session
        </Button>
      </div>

      {/* 7/5, focus first. The challenge (or the re-entry / retake card) is what
          the page is *for*, and the week strip needs the width for its pillars;
          the hobby list is the standing inventory you consult after it. This
          order also decides the mobile stack, where the focus card leads. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FocusColumn {...props} active={active} />
        </div>
        <div className="lg:col-span-5">
          <HobbyColumn {...props} active={active} paused={paused} />
        </div>
      </div>
    </div>
  );
}

/* ─── Greeting ───────────────────────────────────────────────────────────── */

/* ─── Hobby column ───────────────────────────────────────────────────────── */

/**
 * Two groups, split on status and nothing else.
 *
 * A third "New" chip used to sit between them for hobbies without a roadmap.
 * It was not a status — the predicate behind it was `active && stageCount === 0`,
 * which tests for a missing roadmap, so a hobby added eight months ago and
 * never set up still filed under New. It also made "Active" mean *running with a roadmap*, which put a
 * different number on the chip than the cap message's "3 on the go" was
 * counting. Both problems go away by splitting on the only axis that is
 * actually a status.
 *
 * Roadmap-less hobbies still render as their own card inside Active — the
 * distinction is real, it just was not a filter.
 */
type HobbyFilter = "active" | "paused";

/**
 * The cap, explained where it is met, with the way out attached.
 *
 * Shared by the two controls the cap can refuse — "+ Add hobby" and a paused
 * card's Resume. The message says "pause one", so the list is what makes that a
 * thing you can do here rather than an instruction to go elsewhere; it names
 * the hobbies because "which one" is the only question left.
 */
function CapNotice({
  active,
  pausingHobbyId,
  onPause,
}: {
  active: DashboardHobby[];
  pausingHobbyId?: string | null;
  onPause?: (userHobbyId: string) => void;
}) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-[var(--white-muted)] bg-white p-3 text-left shadow-lg"
    >
      <p className="text-[12.5px] leading-[1.5] text-[#6b7280]">{CAP_MESSAGE}</p>

      {onPause && (
        <ul className="mt-2.5 flex flex-col gap-0.5 border-t border-[var(--white-muted)] pt-2">
          {active.map((hobby) => {
            const busy = pausingHobbyId === hobby.userHobbyId;
            return (
              <li key={hobby.userHobbyId} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--foreground)]">
                  {hobby.name}
                </span>
                <button
                  type="button"
                  disabled={Boolean(pausingHobbyId)}
                  onClick={() => onPause(hobby.userHobbyId)}
                  className="flex-shrink-0 cursor-pointer rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[#6b7280] transition-colors hover:bg-[var(--white-muted)] hover:text-[var(--foreground)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Pausing…" : "Pause"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

/**
 * Add hobby, plus the refusal it can no longer perform.
 *
 * At the cap the button reads as unavailable but stays clickable: a real
 * `disabled` attribute would take `pointer-events` with it, and a control that
 * refuses silently is the version people click three times. Pressing it opens
 * the reason instead of the modal, so the cap is explained where it is met
 * rather than after a modal has been opened and dismissed.
 */
function AddHobbyButton({
  atCap,
  active,
  pausingHobbyId,
  onAddHobby,
  onPause,
}: {
  atCap: boolean;
  active: DashboardHobby[];
  pausingHobbyId?: string | null;
  onAddHobby: () => void;
  onPause?: (userHobbyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, useCallback(() => setOpen(false), []));

  /* Dropping under the cap with the note open would leave it stranded, and
     worse, re-showing it the next time the cap is hit without a click. Reset
     during render — the same pattern the filter chips below use. */
  if (!atCap && open) setOpen(false);

  return (
    <div ref={ref} className="relative ml-auto flex-shrink-0">
      <Button
        variant="primary"
        size="sm"
        noScaleOnHover={atCap}
        aria-disabled={atCap}
        aria-expanded={atCap ? open : undefined}
        onClick={atCap ? () => setOpen((v) => !v) : onAddHobby}
        className={atCap ? "opacity-45" : ""}
        style={{ paddingInline: 12, paddingBlock: 6, fontSize: "12.5px" }}
      >
        + Add hobby
      </Button>

      {atCap && open && (
        <CapNotice active={active} pausingHobbyId={pausingHobbyId} onPause={onPause} />
      )}
    </div>
  );
}

/**
 * Resume, refusing the same way Add hobby does.
 *
 * Resuming counts against the cap, so at three active this is as unavailable as
 * adding a fourth — and it used to prove it by running the server call and
 * failing. Same treatment: dimmed, still clickable, opens the same notice.
 */
function ResumeButton({
  hobby,
  atCap,
  active,
  resuming,
  pausingHobbyId,
  onResume,
  onPause,
}: {
  hobby: DashboardHobby;
  atCap: boolean;
  active: DashboardHobby[];
  resuming: boolean;
  pausingHobbyId?: string | null;
  onResume: (userHobbyId: string) => void;
  onPause?: (userHobbyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, useCallback(() => setOpen(false), []));

  if (!atCap && open) setOpen(false);

  return (
    <div ref={ref} className="relative z-20 flex-shrink-0">
      <Button
        variant="primary"
        size="sm"
        disabled={resuming}
        noScaleOnHover={atCap}
        aria-disabled={atCap}
        aria-expanded={atCap ? open : undefined}
        onClick={atCap ? () => setOpen((v) => !v) : () => onResume(hobby.userHobbyId)}
        className={atCap ? "opacity-45" : ""}
        style={{
          ...COMPACT_ACTION,
          backgroundColor: THEME_NEUTRAL.accent,
          color: THEME_NEUTRAL.textOnAccent,
        }}
      >
        {resuming ? "Resuming…" : "Resume Hobby"}
      </Button>

      {atCap && open && (
        <CapNotice active={active} pausingHobbyId={pausingHobbyId} onPause={onPause} />
      )}
    </div>
  );
}

/**
 * One list, active and paused together. Paused hobbies used to sit behind a
 * disclosure; a hobby you have shelved was then also out of sight, which is
 * how it stays shelved. They keep their PAUSED badge and Resume button, and
 * the filter chips — not a toggle — are what shorten the column.
 */
function HobbyColumn({
  variant,
  active,
  paused,
  resumingHobbyId,
  generatingSlugs,
  roadmapErrors,
  onLog,
  onAddHobby,
  onResume,
  onPause,
  pausingHobbyId,
  resumeErrors,
  onGenerateRoadmap,
}: DashboardHomeProps & { active: DashboardHobby[]; paused: DashboardHobby[] }) {
  const [filter, setFilter] = useState<HobbyFilter>("active");
  const allPaused = variant === "all-paused";

  // Only chips that would filter something: "Paused (0)" invites a dead click,
  // and with one group the row is chrome pretending to be a control.
  const chips: { key: HobbyFilter; label: string }[] = [
    ...(active.length > 0 ? [{ key: "active" as const, label: `Active (${active.length})` }] : []),
    ...(paused.length > 0 ? [{ key: "paused" as const, label: `Paused (${paused.length})` }] : []),
  ];

  /* The fallback is written back, not just derived: leaving `filter` on a chip
     that no longer exists meant the column silently jumped back to it the
     moment that chip returned — resume your last paused hobby, pause something
     else later, and you were looking at Paused without having asked.
     Adjusting state during render is React's documented way to reset on a
     prop change. */
  const available = chips.some((c) => c.key === filter);
  const activeFilter = available ? filter : (chips[0]?.key ?? "active");
  if (!available && activeFilter !== filter) setFilter(activeFilter);

  const visible = activeFilter === "paused" ? paused : active;

  return (
    <div>
      {/* One control row, no section label — the chips name the list better
          than "Your hobbies" did, and Add hobby rides along rather than
          needing a header of its own. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* All-paused needs no separate guard — it has exactly one chip. */}
          {chips.length > 1 &&
            chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                aria-pressed={activeFilter === chip.key}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 active:scale-95 ${
                  activeFilter === chip.key
                    ? "bg-[var(--secondary)] text-[var(--foreground)]"
                    : "bg-[var(--white-muted)] text-[#6b7280] hover:text-[var(--foreground)]"
                }`}
              >
                {chip.label}
              </button>
            ))}
        </div>
        <AddHobbyButton
          atCap={active.length >= MAX_ACTIVE_HOBBIES}
          active={active}
          pausingHobbyId={pausingHobbyId}
          onAddHobby={onAddHobby}
          onPause={onPause}
        />
      </div>

      <div className="flex flex-col gap-3">
        {(allPaused ? paused : visible).map((hobby, i) => {
          if (hobby.status === "paused") {
            return (
              <PausedHobbyCard
                key={hobby.userHobbyId}
                hobby={hobby}
                index={i}
                /* One meta for both columns. All-paused used to swap in a
                   history line ("34 sessions · longest streak 6 days"), which
                   the footer's own session tally now says on the right — so the
                   swap had the row stating sessions twice, or suppressing the
                   tally to avoid it. The date is the fact that column is about. */
                meta={pausedMeta(hobby)}
                resuming={resumingHobbyId === hobby.userHobbyId}
                error={resumeErrors?.[hobby.userHobbyId]}
                resumeAction={
                  <ResumeButton
                    hobby={hobby}
                    atCap={active.length >= MAX_ACTIVE_HOBBIES}
                    active={active}
                    resuming={resumingHobbyId === hobby.userHobbyId}
                    pausingHobbyId={pausingHobbyId}
                    onResume={onResume}
                    onPause={onPause}
                  />
                }
                onResume={onResume}
              />
            );
          }

          // No roadmap is its own card, not a greyed-out line of the normal
          // one: there is no stage to show and a different thing to do.
          return needsRoadmap(hobby) ? (
            <NoRoadmapHobbyCard
              key={hobby.userHobbyId}
              hobby={hobby}
              index={i}
              generating={generatingSlugs?.has(hobby.slug)}
              error={roadmapErrors?.[hobby.slug]}
              onGenerate={onGenerateRoadmap}
              onLog={onLog}
            />
          ) : (
            <HobbyCard
              key={hobby.userHobbyId}
              hobby={hobby}
              index={i}
              onLog={onLog}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * "Paused Aug 1" once `paused_at` is populated. Hobbies paused before
 * migration 004 have no date, so they fall back to their last practice.
 */
function pausedMeta(hobby: DashboardHobby): string {
  return (
    pausedOnLabel(hobby.pausedAt) ??
    `Last practised ${lastSessionLabel(hobby.lastSessionDaysAgo)}`
  );
}

/* ─── Focus column ───────────────────────────────────────────────────────── */

function FocusColumn({
  variant,
  active,
  week,
  streak,
  challenges,
  suggestedHobbyId,
  generatingChallengeSlugs,
  challengeErrors,
  onGenerateChallenge,
  onTimerComplete,
  onOpenChallenge,
}: DashboardHomeProps & {
  active: DashboardHobby[];
}) {
  const allPaused = variant === "all-paused";

  // Every active hobby, practised this week or not. Two theme colours cannot
  // separate three hobbies, so the names carry the disambiguation — which only
  // works if the list is complete.
  const legend = active.map((h) => ({ name: h.name, theme: h.theme }));

  /* Every active hobby without a live challenge becomes a step offering one.
     They sit after the real challenges, so the stepper reads as "what you are
     on" then "what else you could start" — and generating for one hobby no
     longer hides the offer for the others, which is what a single-hobby offer
     card did.

     A roadmap is required: the crew builds the challenge around the phase you
     are on, so a hobby with no roadmap has nothing to build against. The
     suggested hobby leads the offers, matching the focus timer's default. */
  const challengedSlugs = new Set(challenges.map((c) => c.hobbySlug));
  const offers = active
    .filter((h) => h.stageCount > 0 && !challengedSlugs.has(h.slug))
    .sort((a, b) => {
      if (a.userHobbyId === suggestedHobbyId) return -1;
      if (b.userHobbyId === suggestedHobbyId) return 1;
      return 0;
    })
    .map((h) => ({ userHobbyId: h.userHobbyId, slug: h.slug, name: h.name }));

  /* All-paused is the only state that swaps the slot, because a paused user has
     no live challenge by definition — `buildLiveChallenges` filters to active
     hobbies, so the slot could never fill.

     Dormant used to get a ReEntryCard here. It does not now: a challenge stays
     `active` with no staleness cutoff, so someone who drifted mid-challenge
     still has the real thing to come back to, and "Continue" on the work they
     abandoned beats a generic card telling them to go easy. With no live
     challenge the slot is simply empty — already the case for an active user
     between challenges — and the focus timer leads instead, which is a better
     first thing for a returning user than another reassurance. */
  const topSlot = allPaused ? (
    <>
      <p className={`mb-2.5 ${SECTION_LABEL}`}>Somewhere to go next</p>
      <RetakeQuizCard />
    </>
  ) : challenges.length > 0 || offers.length > 0 ? (
    /* No label. The dark card already announces itself as the challenge — its
       own chip names the hobby. Which one of the list is showing is the card's
       business; the guard stays here so `topSlot` still reports "empty" to the
       spacing below. */
    <ActiveChallengeCard
      challenges={challenges}
      offers={offers}
      onOpen={onOpenChallenge}
      generatingSlugs={generatingChallengeSlugs}
      errors={challengeErrors}
      onGenerate={onGenerateChallenge}
    />
  ) : null;

  return (
    <div>
      {topSlot}

      {/* An all-empty week for an all-paused user is a scoreboard, not a nudge —
          and there is nothing to time either, so both sit behind one guard. */}
      {!allPaused && (
        <>
          {/* Directly under the challenge: that card says what to do, this
              starts the clock on it. The week strip used to sit between them,
              which on a phone is a screenful of history wedged between a prompt
              and the tool that answers it. */}
          {onTimerComplete && (
            <div className={topSlot ? "mt-4" : ""}>
              <FocusTimerCard
                hobbies={active}
                defaultHobbyId={suggestedHobbyId}
                onComplete={onTimerComplete}
              />
            </div>
          )}

          {/* Last of the three, but not buried: it carries the streak chip, and
              hiding that entirely costs a real signal. */}
          <div className={topSlot || onTimerComplete ? "mt-4" : ""}>
            <PracticeWeek days={week} legend={legend} streak={streak} />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */

/**
 * Brand new — one job: get the user into the discovery quiz. No zeroed stats,
 * no empty scaffolding, no disabled cards.
 */
function NewUserEmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center px-6 pb-16 pt-14 text-center"
    >
      <div className="mb-[22px] flex items-center">
        <span className="opacity-30">
          <FlowerShape size={46} color="#c9c2ba" />
        </span>
        <span className="-mx-1.5">
          <FlowerShape size={62} color="var(--primary)" />
        </span>
        <span className="opacity-30">
          <FlowerShape size={46} color="var(--secondary)" />
        </span>
      </div>

      <h2 className="text-[21px] font-semibold text-[var(--foreground)]">
        Nothing here yet — that&rsquo;s the <em>fun</em> part
      </h2>
      <p className="mt-2.5 max-w-[44ch] text-sm leading-[1.65] text-[#6b7280]">
        Answer a few questions about your time, your taste, and how you like to make things.
        We&rsquo;ll suggest three hobbies worth trying.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: [0, -3, 3, -2, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
          whileHover={{ rotate: 0, scale: 1.05 }}
        >
          <Button href="/discover/quiz" size="md">
            Take the discovery quiz
          </Button>
        </motion.div>
        <Button href="/discover" size="md" variant="outline" outlineColor="#d1d5db" outlineHoverColor="#6b7280">
          Browse all hobbies
        </Button>
      </div>

      <p className="mt-4 text-[11.5px] text-[#6b7280]">Takes about two minutes.</p>
    </motion.div>
  );
}
