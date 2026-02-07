"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { HobbyCard, NoRoadmapHobbyCard, PausedHobbyCard } from "./HobbyCard";
import { PracticeWeek } from "./PracticeWeek";
import { FocusTimerCard } from "./FocusTimerCard";
import { ActiveChallengeCard, ReEntryCard, RetakeQuizCard } from "./DashboardCards";
import {
  isNewHobby,
  lastSessionLabel,
  pausedOnLabel,
  pickResumeCandidateId,
  type DashboardChallenge,
  type DashboardHobby,
  type DashboardVariant,
  type StreakState,
  type WeekDay,
} from "@/lib/dashboardHome";
import { fadeUp } from "@/components/ui/animations";

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
  /** Called with no slug for the header button: the modal then asks which hobby. */
  onLog: (slug?: string) => void;
  onAddHobby: () => void;
  onResume: (userHobbyId: string) => void;
  onGenerateRoadmap: (slug: string) => void;
  /** Tick/untick a roadmap checklist item. Omitted in read-only previews. */
  onToggleGoal?: (userRoadmapId: string, goalKey: string) => void;
  /** Fired when the focus timer runs out. Omitting it hides the timer card. */
  onTimerComplete?: (hobbySlug: string, minutes: number) => void;
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
 * The left rail from the design handoff is deliberately absent: the app's own
 * DashboardNav already owns navigation and is left untouched.
 */
export function DashboardHome(props: DashboardHomeProps) {
  const { variant, firstName, streak, hobbies, suggestedHobbyId, onLog } = props;

  const active = hobbies.filter((h) => h.status === "active");
  const paused = hobbies.filter((h) => h.status === "paused");

  // Dormant shows a re-entry card for one hobby. If that same hobby also owned
  // the suggested row, it got two filled buttons with two different verbs and
  // two destinations — so the card wins and the row drops back to outline.
  const reEntryHobby = variant === "dormant" ? (active[0] ?? null) : null;
  const rowSuggestedId =
    reEntryHobby && reEntryHobby.userHobbyId === suggestedHobbyId ? null : suggestedHobbyId;

  if (variant === "new") return <NewUserEmptyState />;

  return (
    /* No page header. It carried only the weekday, which now rides above the
       greeting as an eyebrow — a 56px bordered band was a lot of chrome for one
       word. Without it there is nothing to run edge to edge, so DashboardNav's
       own <main> padding is left alone rather than cancelled and re-added. */
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <Greeting
          variant={variant}
          firstName={firstName}
          hobbies={active}
          streak={streak}
          suggestedHobbyId={suggestedHobbyId}
        />

        {/* Deliberately guesses nothing: it opens the modal with no hobby
            chosen, so it never competes with a card's own pre-filled button.
            Still no FAB — this is the one global entry point. */}
        <Button size="sm" variant="outline" outlineColor="#d1d5db" outlineHoverColor="#6b7280" onClick={() => onLog()}>
          Log session
        </Button>
      </div>

      {/* 7/5, focus first. The challenge (or the re-entry / retake card) is what
          the page is *for*, and the week strip needs the width for its pillars;
          the hobby list is the standing inventory you consult after it. This
          order also decides the mobile stack, where the focus card leads. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FocusColumn {...props} active={active} reEntryHobby={reEntryHobby} />
        </div>
        <div className="lg:col-span-5">
          <HobbyColumn
            {...props}
            active={active}
            paused={paused}
            suggestedHobbyId={rowSuggestedId}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Greeting ───────────────────────────────────────────────────────────── */

/**
 * Every state gets a header, `active` included — it is the one users see daily,
 * and it used to open on a bare row count.
 *
 * Re-entry without guilt throughout: no "you broke your streak", no
 * lost-progress framing, and the ask is shrunk rather than raised.
 */
function Greeting({
  variant,
  firstName,
  hobbies,
  streak,
  suggestedHobbyId,
}: {
  variant: DashboardVariant;
  firstName: string;
  hobbies: DashboardHobby[];
  streak: StreakState;
  suggestedHobbyId: string | null;
}) {
  const gapDays = hobbies
    .map((h) => h.lastSessionDaysAgo)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0];

  const suggested = hobbies.find((h) => h.userHobbyId === suggestedHobbyId) ?? null;

  let title: string;
  let line: ReactNode;

  if (variant === "all-paused") {
    title = `Everything's on pause, ${firstName}`;
    line = "Which is allowed. Resume one when you're ready, or try something different.";
  } else if (variant === "dormant") {
    if (gapDays === undefined) {
      title = `Ready when you are, ${firstName}`;
      line = "Nothing logged yet. Pick a hobby and start as small as you like.";
    } else {
      title = `Welcome back, ${firstName}`;
      line = `It's been ${gapDays} days. Everything's exactly where you left it.`;
    }
  } else if (streak.loggedToday) {
    // Today is already covered — acknowledge it and ask for nothing further.
    title = `That's today done, ${firstName}`;
    line = "Anything else you do today is a bonus.";
  } else if (suggested) {
    title = `Good to see you, ${firstName}`;
    line = (
      <>
        {suggested.name} was {lastSessionLabel(suggested.lastSessionDaysAgo)}.{" "}
        <em>Ten minutes</em> today would be plenty.
      </>
    );
  } else {
    title = `Good to see you, ${firstName}`;
    line = "Pick whichever one you feel like — ten minutes is plenty.";
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="min-w-0">
      <p className="text-[19px] font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-[13px] text-[#6b7280]">{line}</p>
    </motion.div>
  );
}

/* ─── Hobby column ───────────────────────────────────────────────────────── */

type HobbyFilter = "all" | "new" | "paused";

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
  suggestedHobbyId,
  resumingHobbyId,
  generatingSlugs,
  roadmapErrors,
  onLog,
  onAddHobby,
  onResume,
  onGenerateRoadmap,
  onToggleGoal,
}: DashboardHomeProps & { active: DashboardHobby[]; paused: DashboardHobby[] }) {
  const [filter, setFilter] = useState<HobbyFilter>("all");
  const allPaused = variant === "all-paused";
  const resumeCandidateId = allPaused ? pickResumeCandidateId(paused) : null;

  // buildDashboardHobbies already orders active-then-paused, so one concat
  // keeps the blue/lime rhythm and the reading order it assigned.
  const all = [...active, ...paused];
  const newCount = active.filter(isNewHobby).length;

  // Only chips that would actually filter something. A lone "All" chip is
  // chrome that does nothing, and "Paused (0)" invites a dead click.
  const chips: { key: HobbyFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...(newCount > 0 ? [{ key: "new" as const, label: `New (${newCount})` }] : []),
    ...(paused.length > 0 ? [{ key: "paused" as const, label: `Paused (${paused.length})` }] : []),
  ];

  // Resuming the last paused hobby empties the "Paused" view — fall back
  // rather than leaving the user staring at nothing they can act on.
  const activeFilter = chips.some((c) => c.key === filter) ? filter : "all";

  const visible = all.filter((hobby) => {
    if (activeFilter === "new") return isNewHobby(hobby);
    if (activeFilter === "paused") return hobby.status === "paused";
    return true;
  });

  return (
    <div>
      {/* One control row, no section label — the chips name the list better
          than "Your hobbies" did, and Add hobby rides along rather than
          needing a header of its own. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {!allPaused &&
            chips.length > 1 &&
            chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                aria-pressed={activeFilter === chip.key}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 active:scale-95 ${
                  activeFilter === chip.key
                    ? "bg-[var(--foreground)] text-white"
                    : "bg-[var(--white-muted)] text-[#6b7280] hover:text-[var(--foreground)]"
                }`}
              >
                {chip.label}
              </button>
            ))}
        </div>
        <button
          onClick={onAddHobby}
          className="ml-auto cursor-pointer text-[11.5px] font-bold text-[var(--primary)] transition-opacity hover:opacity-70"
        >
          + Add hobby
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {(allPaused ? paused : visible).map((hobby, i) => {
          if (hobby.status === "paused") {
            return (
              <PausedHobbyCard
                key={hobby.userHobbyId}
                hobby={hobby}
                index={i}
                // All-paused has no next step to name, so it shows history
                // instead; in a mixed list the last session is the useful bit.
                meta={allPaused ? pausedHistoryMeta(hobby) : pausedMeta(hobby)}
                metaIsTime={!allPaused}
                emphasised={hobby.userHobbyId === resumeCandidateId}
                resuming={resumingHobbyId === hobby.userHobbyId}
                onResume={onResume}
              />
            );
          }

          // No roadmap is its own card, not a greyed-out line of the normal
          // one: there is no stage to show and a different thing to do.
          return isNewHobby(hobby) ? (
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
              suggested={hobby.userHobbyId === suggestedHobbyId}
              onLog={onLog}
              onToggleGoal={onToggleGoal}
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

/** All-paused rows carry history instead of a next step — there isn't one yet. */
function pausedHistoryMeta(hobby: DashboardHobby): string {
  if (hobby.totalSessions === 0) return "Never really started";
  if (hobby.totalSessions === 1) return "1 session · never really started";
  return `${hobby.totalSessions} sessions · longest streak ${hobby.longestStreak} day${
    hobby.longestStreak === 1 ? "" : "s"
  }`;
}

/* ─── Focus column ───────────────────────────────────────────────────────── */

function FocusColumn({
  variant,
  active,
  week,
  streak,
  challenges,
  reEntryHobby,
  suggestedHobbyId,
  onTimerComplete,
}: DashboardHomeProps & {
  active: DashboardHobby[];
  reEntryHobby: DashboardHobby | null;
}) {
  const challenge = challenges[0] ?? null;
  const allPaused = variant === "all-paused";

  // Every active hobby, practised this week or not. Two theme colours cannot
  // separate three hobbies, so the names carry the disambiguation — which only
  // works if the list is complete.
  const legend = active.map((h) => ({ name: h.name, theme: h.theme }));

  /* The challenge slot is replaced, never shown empty. */
  const topSlot = allPaused ? (
    <>
      <p className={`mb-2.5 ${SECTION_LABEL}`}>Somewhere to go next</p>
      <RetakeQuizCard />
    </>
  ) : variant === "dormant" ? (
    reEntryHobby && (
      <>
        <p className={`mb-2.5 ${SECTION_LABEL}`}>Pick up where you left off</p>
        <ReEntryCard hobbyName={reEntryHobby.name} hobbySlug={reEntryHobby.slug} />
      </>
    )
  ) : challenge ? (
    /* No label. The dark card already announces itself as the challenge —
       its own eyebrow names the hobby and the day. */
    <ActiveChallengeCard challenge={challenge} moreCount={challenges.length - 1} />
  ) : null;

  return (
    <div>
      {topSlot}

      {/* An all-empty week for an all-paused user is a scoreboard, not a nudge —
          and there is nothing to time either, so both sit behind one guard. */}
      {!allPaused && (
        <>
          <div className={topSlot ? "mt-4" : ""}>
            <PracticeWeek days={week} legend={legend} streak={streak} />
          </div>

          {onTimerComplete && (
            <div className="mt-4">
              <FocusTimerCard
                hobbies={active}
                defaultHobbyId={suggestedHobbyId}
                onComplete={onTimerComplete}
              />
            </div>
          )}
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
