"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Flame, Map, Tv, MapPin, Zap } from "lucide-react";
import { ChallengeCard } from "./ChallengeCard";
import { ActiveChallengePanel } from "./ActiveChallengePanel";
import { ChallengeArchive } from "./ChallengeArchive";
import { RoadmapDetail } from "./RoadmapDetail";
import { Button } from "@/components/ui/Button";
import { moodEmojis } from "@/lib/dashboardData";
import type { ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";
import type { HobbyTheme } from "@/lib/dashboardHome";
import type { PracticeFeedback } from "@/app/actions/feedback";
import { fadeUp, staggerContainer } from "@/components/ui/animations";

const stagger = staggerContainer(0.08);

/**
 * The page paints itself in the hobby's own theme, so a lime card on the
 * dashboard opens a lime page. It was a fixed grey, which made this the one
 * surface ignoring the blue/lime alternation that §2.2 of src/CLAUDE.md calls
 * the most recognisable structural rule in the product.
 */
const THEME = {
  primary: { color: "var(--primary)", lightColor: "var(--primary-theme-bg)" },
  secondary: { color: "var(--secondary)", lightColor: "var(--secondary-theme-bg)" },
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
  /** Opens the roadmap modal the page owns. */
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
  /** Opens a challenge in the modal the page owns. */
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

  /** The danger zone, which only the real page can wire to its mutations. */
  dangerZone?: ReactNode;
}

/**
 * One hobby, end to end — now the only destination below the dashboard.
 *
 * Split into two columns on a seam that means something: **do now** on the left
 * (the challenge, the roadmap stage you are on), **look back** on the right
 * (stats, sessions, the challenge archives). Nine full-width sections stacked
 * vertically made every block equally loud and pushed the roadmap below a fold
 * it had no reason to be under.
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
  dangerZone,
}: HobbyJourneyProps) {
  const META = THEME[theme];
  const activeChallenges = challenges.filter((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");
  const skippedChallenges = challenges.filter((c) => c.status === "skipped");
  // Completed first: finishing one is the part worth seeing.
  const pastChallenges = [...completedChallenges, ...skippedChallenges];
  const totalHours = (sessions.reduce((sum, s) => sum + s.duration, 0) / 60).toFixed(1);

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
        className="rounded-2xl overflow-hidden mb-6"
        style={{ backgroundColor: META.lightColor }}
      >
        <div className="px-6 py-8 md:px-10 md:py-12 relative flex items-start justify-between gap-4">
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: META.color }}
          />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-medium text-gray-900 leading-tight mb-2">{name}</h1>
            <p className="text-gray-600">
              {hobby?.status === "active" ? "Active" : "Paused"} &middot; Day {hobby?.daysSinceStart ?? 0} of your journey
            </p>
          </div>
          <Button
            onClick={onLogPractice}
            variant="secondary"
            shape="pill"
            size="sm"
            className="relative z-10 flex-shrink-0 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log Practice
          </Button>
        </div>
      </motion.div>

      {/* ── Do now / look back ── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* ─── Do now ─── */}
        {/* The wide column: with the challenge open in place, this side carries
            the reading. */}
        <div className="space-y-6 lg:col-span-7">

          <motion.div variants={fadeUp}>
            {activeChallenges.length > 0 ? (
              <div className="space-y-4">
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
                    />
                  ) : (
                    <ChallengeCard key={c.id} challenge={c} onOpen={onOpenChallenge} />
                  ),
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="card-heading mb-2">Current Challenge</p>
                <p className="text-sm text-gray-400 mb-3">No active challenge</p>
                {challengeError && (
                  <p className="mb-3 text-sm text-red-600">{challengeError}</p>
                )}
                <button
                  onClick={onGenerateChallenge}
                  disabled={generatingChallenge}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: META.color }}
                >
                  {generatingChallenge ? (
                    <><div className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />Generating...</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" />Generate a Challenge</>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp}>
            <h2 className="card-heading mb-4">Learning Roadmap</h2>
            {roadmap && onAdvancePhase ? (
              /* The whole path, open. It was a summary that opened a modal
                 holding this exact component — a click that bought nothing but
                 a second header, on the one page the roadmap belongs to. */
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
        </div>

        {/* ─── Look back ─── */}
        <div className="space-y-6 lg:col-span-5">

          {/* Two tiles, not four. "Sessions" repeated the count in the header
              directly below it, and "Challenges" the archive further down —
              half the row restated its own neighbours. Hours and streak are the
              two figures nothing else on the page carries. */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
            {[
              { label: "Hours practised", value: `${totalHours}h` },
              { label: "Current streak", value: `${hobby?.currentStreak ?? 0}d`, icon: <Flame className="w-4 h-4 text-[var(--secondary)]" /> },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                {s.icon && <div className="flex justify-center mb-1">{s.icon}</div>}
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* The whole log, not a preview of it: the sessions index is gone, so
              this is the only place a session can be found. */}
          <motion.div variants={fadeUp}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="card-heading">Sessions</h2>
              {sessions.length > 0 && (
                <span className="caption">{sessions.length} logged</span>
              )}
            </div>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const mood = moodEmojis[s.mood] ?? { emoji: "", label: "" };
                  const fb = feedbackMap[s.id];
                  return (
                    <Link key={s.id} href={sessionHref(s.id)}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: META.color + "20" }}>
                            {mood.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-700">{s.duration} min</p>
                              <span className="text-xs text-gray-400">
                                {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{s.notes || "No notes"}</p>
                          </div>
                        </div>
                        {fb?.celebration && (
                          <p className="mt-2 text-xs italic pl-14" style={{ color: META.color }}>{fb.celebration}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-sm text-gray-400">No sessions yet for {name}.</p>
              </div>
            )}
          </motion.div>

          {/* One archive, not two stacked. Completed and swapped-out are the
              same question — what has this hobby already thrown at me — and
              the swapped ones are kept because their titles feed the crew's
              "do not repeat" prompt. */}
          {pastChallenges.length > 0 && (
            <motion.div variants={fadeUp}>
              <ChallengeArchive challenges={pastChallenges} onOpen={onOpenChallenge} />
            </motion.div>
          )}

        </div>
      </div>

      {/* Go deeper */}
      <motion.div variants={fadeUp} className="mt-8">
        <h2 className="card-heading mb-4">Go deeper with {name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: watchHref, icon: Tv, title: "Watch", sub: "Videos & tutorials" },
            { href: microHref, icon: Zap, title: "Micro", sub: "Quick exercises" },
            { href: localHref, icon: MapPin, title: "Local", sub: "Venues near you" },
          ].map(({ href, icon: Icon, title, sub }) => (
            <Link key={title} href={href} className="group">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: META.color + "15" }}>
                  <Icon className="w-5 h-5" style={{ color: META.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Rename / pause / delete. Last on the page on purpose — you scroll
          past everything the hobby is before you get to unmaking it. */}
      {dangerZone && <motion.div variants={fadeUp} className="mt-8">{dangerZone}</motion.div>}
    </motion.div>
  );
}
