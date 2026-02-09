"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Play, Map, Tv, MapPin, Zap } from "lucide-react";
import { ChallengeCard } from "./ChallengeCard";
import { ActiveChallengePanel } from "./ActiveChallengePanel";
import { ChallengeArchive } from "./ChallengeArchive";
import { PracticeLog } from "./PracticeLog";
import { RoadmapDetail } from "./RoadmapDetail";
import type { ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";
import type { HobbyTheme } from "@/lib/dashboardHome";
import type { PracticeFeedback } from "@/app/actions/feedback";
import { swapCooldownLeft } from "@/lib/challengeLimits";
import { fadeUp, staggerContainer } from "@/components/ui/animations";

const stagger = staggerContainer(0.08);

/**
 * The page paints itself in the hobby's own theme, so a lime card on the
 * dashboard opens a lime page. It was a fixed grey, which made this the one
 * surface ignoring the blue/lime alternation that §2.2 of src/CLAUDE.md calls
 * the most recognisable structural rule in the product.
 */
const THEME = {
  primary: {
    color: "var(--primary)",
    lightColor: "var(--primary-theme-bg)",
    borderColor: "var(--primary-theme-border)",
  },
  secondary: {
    color: "var(--secondary)",
    lightColor: "var(--secondary-theme-bg)",
    borderColor: "var(--secondary-theme-border)",
  },
} as const;

export interface HobbyJourneyProps {
  name: string;
  slug: string;
  /** Matches the card that linked here — see `themeForActiveHobbies`. */
  theme: HobbyTheme;
  hobby: ActiveHobby | null;
  sessions: PracticeSession[];
  challenges: Challenge[];
  roadmap: Roadmap | null;
  feedbackMap: Record<string, PracticeFeedback>;

  backHref: string;
  sessionHref: (sessionId: string) => string;
  watchHref: string;
  microHref: string;
  localHref: string;

  generatingChallenge?: boolean;
  /** A refused generation — shown under the button rather than swallowed. */
  challengeError?: string | null;
  /** A refused roadmap build — most often the already-has-one guard. */
  roadmapError?: string | null;
  generatingRoadmap?: boolean;
  onGenerateChallenge: () => void;
  onGenerateRoadmap: () => void;
  onLogPractice: () => void;
  /** Omitted hides the Start Timer button — there is no timer to start yet. */
  onStartTimer?: () => void;
  /** Opens a past challenge in the modal the page owns. */
  onOpenChallenge?: (challenge: Challenge) => void;

  /* ── The active challenge's own actions, now that it is open on the page ── */
  /** Hands over to the session logger; the page completes it once a session saves. */
  onLogAndComplete?: (challenge: Challenge) => void;
  /** Reject the active challenge and generate a replacement. */
  onSwapChallenge?: (challenge: Challenge) => void;
  /** A swap already in flight. */
  swappingChallenge?: boolean;
  /** A refused swap — shown on the card. */
  swapError?: string | null;
  onDismissSwapError?: () => void;

  /* ── The roadmap's own actions, now that it is open on the page ── */
  advancingPhase?: boolean;
  advanceError?: string | null;
  onAdvancePhase?: () => void;
  onToggleGoal?: (userRoadmapId: string, goalKey: string) => void;

  /** Rename / pause / delete, which only the real page can wire to its
   *  mutations. Sits in the banner opposite the status chip. */
  actions?: ReactNode;
}

/**
 * One hobby, end to end — now the only destination below the dashboard.
 *
 * Three rows, each holding what fits its own shape: row 1 pairs the challenge
 * you are on against the archive of ones you are not, row 2 gives the roadmap
 * the full width its horizontal series needs, row 3 does the same for the
 * practice log's grid. Nine full-width sections stacked vertically made every
 * block equally loud; two columns then made the roadmap and the log fight for
 * a half-width they both outgrew.
 *
 * It absorbed two things when their pages were deleted: the whole session list
 * (there is no sessions index any more) and the swapped-out challenge archive
 * (from Progress).
 */
export function HobbyJourney({
  name,
  theme,
  hobby,
  sessions,
  challenges,
  roadmap,
  feedbackMap,
  backHref,
  sessionHref,
  watchHref,
  microHref,
  localHref,
  generatingChallenge = false,
  challengeError,
  roadmapError,
  generatingRoadmap = false,
  onGenerateChallenge,
  onGenerateRoadmap,
  onLogPractice,
  onStartTimer,
  onOpenChallenge,
  onLogAndComplete,
  onSwapChallenge,
  swappingChallenge = false,
  swapError,
  onDismissSwapError,
  advancingPhase = false,
  advanceError,
  onAdvancePhase,
  onToggleGoal,
  actions,
}: HobbyJourneyProps) {
  const META = THEME[theme];

  /* The browser resolves `#roadmap` at navigation time, when this page is still
     a `PageSkeleton` — the target does not exist yet, so the hash silently does
     nothing and you land at the top. This runs the jump once the real content
     is mounted, which is the first moment there is anything to jump to.

     `requestAnimationFrame` waits for the layout that mount triggers; reading
     the position in the same tick measures the frame before it. */
  useEffect(() => {
    if (window.location.hash !== "#roadmap") return;

    const frame = requestAnimationFrame(() => {
      document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const activeChallenges = challenges.filter((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const skippedChallenges = challenges.filter((c) => c.status === "skipped");
  // Completed first: finishing one is the part worth seeing.
  const pastChallenges = [...completedChallenges, ...skippedChallenges];

  /* Read from the skips already on the page rather than fetched: the cooldown
     is per hobby, and every one of this hobby's challenges is right here. */
  const swapCooldownHours = swapCooldownLeft(skippedChallenges.map((c) => c.skippedDate));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full px-4 py-8 md:px-8 md:py-12">
      {/* Back link → Hobbies */}
      <motion.div variants={fadeUp} className="mb-6">
        <Link href={backHref} className="back-link">
          <ArrowLeft className="w-4 h-4" /> Hobbies
        </Link>
      </motion.div>

      {/* Hobby banner */}
      <motion.div
        variants={fadeUp}
        className="rounded-3xl mb-8 border shadow-sm transition-colors duration-300"
        style={{ backgroundColor: META.lightColor, borderColor: META.borderColor }}
      >
        <div className="px-6 py-8 md:px-10 md:py-10 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* The clip belongs to the decoration, not the banner: `overflow-hidden`
              on the card cropped the ⋯ menu, which opens past its lower edge. */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
              style={{ backgroundColor: META.color }}
            />
          </div>
          {/* Opposite the status chip, which is the thing pause flips. */}
          {actions && <div className="absolute right-5 top-5 z-20 md:right-6 md:top-6">{actions}</div>}

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-xs font-semibold mb-3 border border-gray-200/50 text-gray-700">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: META.color }} />
              {hobby?.status === "active" ? "Active Hobby" : "Paused"}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">{name}</h1>
            <p className="text-gray-600 text-sm md:text-base font-medium">
              Day {hobby?.daysSinceStart ?? 0} of your journey &middot; {sessions.length}{" "}
              {sessions.length === 1 ? "session" : "sessions"} logged
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3 flex-wrap">
            {onStartTimer && (
              <button
                onClick={onStartTimer}
                style={{ backgroundColor: META.color }}
                className="px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                Start Timer
              </button>
            )}
            <button
              onClick={onLogPractice}
              className="px-5 py-3 rounded-2xl text-sm font-bold bg-white text-gray-800 border border-gray-200 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Practice
            </button>
          </div>
        </div>
      </motion.div>

      {/* Three rows rather than two columns. The roadmap and the practice log
          both want the full width — one is a horizontal series, the other a
          grid — and neither was ever a sidebar's worth of content. What is left
          in row 1 is the pair you actually compare: what you are on, and what
          you have already been through. */}
      <div className="space-y-8">

        {/* ─── Row 1: what you are on / what you have done ─── */}
        <div className="grid items-stretch gap-6 lg:grid-cols-12">

          <motion.div variants={fadeUp} className="flex flex-col lg:col-span-7">
            {activeChallenges.length > 0 ? (
              <div className="flex flex-1 flex-col gap-4">
                {activeChallenges.map((c) =>
                  onLogAndComplete ? (
                    <ActiveChallengePanel
                      key={c.id}
                      challenge={c}
                      onLogAndComplete={onLogAndComplete}
                      busy={swappingChallenge}
                      onSwap={onSwapChallenge}
                      swapError={swapError}
                      onDismissSwapError={onDismissSwapError}
                      swapCooldownHours={swapCooldownHours}
                    />
                  ) : (
                    <ChallengeCard key={c.id} challenge={c} onOpen={onOpenChallenge} />
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <p className="card-heading mb-2">Current Challenge</p>
                <p className="text-sm text-gray-400 mb-3">No active challenge</p>
                {challengeError && (
                  <p className="mb-3 text-sm text-red-600">{challengeError}</p>
                )}
                {/* `self-center`: the parent is a flex *column*, so a button
                    left to its own devices stretches to the card's full width
                    on the cross axis, however `inline-flex` it says it is. */}
                <button
                  onClick={onGenerateChallenge}
                  disabled={generatingChallenge}
                  className="self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: META.color }}
                >
                  {generatingChallenge ? (
                    <><div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />Generating...</>
                  ) : (
                    "Generate a Challenge"
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* One archive, not two stacked. Completed and swapped-out are the
              same question — what has this hobby already thrown at me — and
              the swapped ones are kept because their titles feed the crew's
              "do not repeat" prompt. */}
          {/* Always rendered, empty included: the row is a pair, and dropping
              the archive let the challenge panel sprawl to full width and back
              again as the first challenge was finished. */}
          <motion.div variants={fadeUp} className="flex flex-col lg:col-span-5">
            <ChallengeArchive challenges={pastChallenges} onOpen={onOpenChallenge} />
          </motion.div>
        </div>

        {/* ─── Row 2: the whole path ───
            `id` is the target of the dashboard card's checklist rows, which
            link here rather than ticking in place. `scroll-mt` clears the
            sticky header the anchor would otherwise land behind. */}
        <motion.div variants={fadeUp} id="roadmap" className="scroll-mt-20">
          <h2 className="card-heading mb-4">Learning Roadmap</h2>
          {roadmap && onAdvancePhase ? (
            /* The whole path, open. It was a summary that opened a modal
               holding this exact component — a click that bought nothing but a
               second header, on the one page the roadmap belongs to. */
            <RoadmapDetail
              inline
              roadmap={roadmap}
              themeColor={META.color}
              advancing={advancingPhase}
              error={advanceError}
              onAdvance={onAdvancePhase}
              onToggleGoal={onToggleGoal}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">No roadmap yet for {name}</p>
              <button
                onClick={onGenerateRoadmap}
                disabled={generatingRoadmap}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: META.color }}
              >
                {generatingRoadmap ? (
                  <><div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />Generating Roadmap...</>
                ) : (
                  <><Map className="w-3.5 h-3.5" />Generate Roadmap</>
                )}
              </button>
              {roadmapError && (
                <p className="mt-3 text-sm text-red-600">{roadmapError}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* ─── Row 3: everything you have logged ─── */}
        <motion.div variants={fadeUp}>
          <PracticeLog
            sessions={sessions}
            feedbackMap={feedbackMap}
            sessionHref={sessionHref}
            onLogPractice={onLogPractice}
            themeColor={META.color}
            hobbyName={name}
          />
        </motion.div>
      </div>

      {/* Go deeper */}
      <motion.div variants={fadeUp} className="mt-8">
        <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">Go deeper with {name}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Three other ways in, when a challenge is not the thing you need today.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { href: watchHref, icon: Tv, title: "Watch", sub: "Videos & tutorials" },
              { href: microHref, icon: Zap, title: "Micro", sub: "Quick exercises" },
              { href: localHref, icon: MapPin, title: "Local", sub: "Venues near you" },
            ].map(({ href, icon: Icon, title, sub }) => (
              <Link
                key={title}
                href={href}
                className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-slate-50/70 p-4 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white"
                  style={{ color: META.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-gray-900">{title}</p>
                  <p className="text-xs font-medium text-gray-500">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Rename / pause / delete. Last on the page on purpose — you scroll
          past everything the hobby is before you get to unmaking it. */}
    </motion.div>
  );
}
