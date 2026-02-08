"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { roadmapGoalKey } from "@/lib/dashboardData";
import type { Roadmap, RoadmapPhase } from "@/lib/dashboardData";

export interface RoadmapDetailProps {
  roadmap: Roadmap;
  advancing?: boolean;
  /** A refused advance — shown in place rather than logged and dropped. */
  error?: string | null;
  /**
   * Tick a goal. Omitted renders the list read-only.
   *
   * Without this the roadmap was strictly less capable than the dashboard card
   * that links to it: `HobbyCard` renders these same goals as a live checklist,
   * so ticks made there appeared to vanish on "the full roadmap".
   */
  onToggleGoal?: (userRoadmapId: string, goalKey: string) => void;
  /** Fired once the confirm step is accepted. The caller owns the write. */
  onAdvance: () => void;
  /**
   * The hobby's own colour. Omitted keeps the neutral grey the modal used —
   * §2.2's alternation only means something on a surface that is already
   * painted in it.
   */
  themeColor?: string;
  /** Renders as a card on a page rather than the body of a modal. */
  inline?: boolean;
}

const NEUTRAL = "#374151";
const EMERALD = "#10b981";

/* The accent arrives as `var(--primary)` as often as a hex, and `accent + "25"`
   silently produces invalid CSS for the former — a transparent fill rather than
   a tint. `color-mix` takes both. */
const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** One card's width plus the flex gap — how far one arrow press travels. */
const SCROLL_STEP = 336;

/**
 * The whole path, one card per phase, scrolled horizontally.
 *
 * Was a page (`/dashboard/roadmap/[slug]`), then a modal, then a vertical
 * accordion. The accordion answered "what am I on" and "what shape is this"
 * with the same control: reading phase four meant closing phase two. Side by
 * side the whole path is legible at once, and the page stops growing taller
 * with every phase the crew writes.
 *
 * **Every phase is fully open, including ones not yet reached.** An earlier
 * version withheld future goals so the roadmap would not spoil itself, but the
 * question it answers is "what am I signing up for".
 */
export function RoadmapDetail({
  roadmap,
  advancing = false,
  error,
  onAdvance,
  onToggleGoal,
  themeColor,
  inline = false,
}: RoadmapDetailProps) {
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const done = new Set(roadmap.completedGoals);
  const accent = themeColor ?? NEUTRAL;

  const isLastPhase = roadmap.currentPhase >= roadmap.totalPhases - 1;
  const percent = ((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100;

  /* `block: "nearest"` keeps this from dragging the whole page up on mount —
     only the carousel scrolls. */
  const focusActive = () => {
    scroller.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  useEffect(focusActive, [roadmap.currentPhase]);

  const scrollStep = (direction: 1 | -1) =>
    scroller.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });

  const handleConfirm = () => {
    setConfirmAdvance(false);
    onAdvance();
  };

  return (
    <div className={inline ? "rounded-3xl border border-gray-200/90 bg-white p-5 shadow-sm md:p-7" : "p-6 md:p-8"}>
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {/* The hobby name is the page's own h1 when this is inline. */}
          {!inline && (
            <span className="mb-2 inline-block rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
              {roadmap.hobbyName}
            </span>
          )}
          <h2 className={inline ? "text-lg font-bold tracking-tight text-gray-900" : "page-title"}>
            {roadmap.title}
          </h2>
          <p className="body-sm mt-0.5">{roadmap.description}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="hidden w-36 rounded-2xl border border-gray-100 bg-gray-50 p-2.5 md:block">
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-800">{Math.round(percent)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: accent }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => scrollStep(-1)}
              aria-label="Scroll to earlier phases"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={focusActive}
              className="cursor-pointer px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900"
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => scrollStep(1)}
              aria-label="Scroll to later phases"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div
        ref={scroller}
        className="-mx-1 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 pt-1"
      >
        {roadmap.phases.map((phase, idx) => (
          <PhaseCard
            key={phase.phase_number}
            phase={phase}
            isComplete={idx < roadmap.currentPhase}
            isCurrent={idx === roadmap.currentPhase}
            isLastPhase={isLastPhase}
            nextTitle={roadmap.phases[idx + 1]?.title}
            completedGoals={done}
            accent={accent}
            advancing={advancing}
            confirming={confirmAdvance && idx === roadmap.currentPhase}
            onStartConfirm={() => setConfirmAdvance(true)}
            onCancelConfirm={() => setConfirmAdvance(false)}
            onConfirm={handleConfirm}
            onToggleGoal={
              onToggleGoal && roadmap.userRoadmapId
                ? (key) => onToggleGoal(roadmap.userRoadmapId, key)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

interface PhaseCardProps {
  phase: RoadmapPhase;
  isComplete: boolean;
  isCurrent: boolean;
  isLastPhase: boolean;
  nextTitle?: string;
  completedGoals: Set<string>;
  accent: string;
  advancing: boolean;
  confirming: boolean;
  onStartConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirm: () => void;
  onToggleGoal?: (goalKey: string) => void;
}

function PhaseCard({
  phase,
  isComplete,
  isCurrent,
  isLastPhase,
  nextTitle,
  completedGoals,
  accent,
  advancing,
  confirming,
  onStartConfirm,
  onCancelConfirm,
  onConfirm,
  onToggleGoal,
}: PhaseCardProps) {
  const ticked = phase.goals.filter((_, i) =>
    completedGoals.has(roadmapGoalKey(phase.phase_number, i)),
  ).length;
  const goalPercent = phase.goals.length > 0 ? Math.round((ticked / phase.goals.length) * 100) : 0;

  return (
    <div
      data-current={isCurrent ? "true" : "false"}
      style={isCurrent ? { borderColor: accent, backgroundColor: tint(accent, 6) } : undefined}
      className={`flex w-[290px] flex-shrink-0 snap-center flex-col justify-between rounded-3xl border p-5 transition-all sm:w-[320px] ${
        isCurrent
          ? "border-2 shadow-md"
          : isComplete
            ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
            : "border-gray-200 bg-gray-50/40 opacity-80 hover:bg-white hover:opacity-100"
      }`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              style={
                isCurrent
                  ? { backgroundColor: accent, color: "#fff" }
                  : isComplete
                    ? { backgroundColor: tint(accent, 20), color: accent }
                    : undefined
              }
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isComplete || isCurrent ? "" : "bg-gray-100 text-gray-400"
              }`}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : phase.phase_number}
            </div>
            <span
              style={isCurrent ? { backgroundColor: tint(accent, 18), color: accent } : undefined}
              className={`truncate rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                isCurrent
                  ? ""
                  : isComplete
                    ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCurrent ? "Active phase" : isComplete ? "Completed" : `Phase ${phase.phase_number}`}
            </span>
          </div>
          <span className="flex-shrink-0 text-[11px] font-medium text-gray-400">
            {phase.time_per_week}
          </span>
        </div>

        <h3 className="mb-1.5 text-base font-extrabold tracking-tight text-gray-900">{phase.title}</h3>
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-gray-600">{phase.description}</p>

        {phase.goals.length > 0 && (
          <>
            <div className="mb-4 rounded-2xl border border-gray-100 bg-white/80 p-2.5">
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-500">Phase progress</span>
                <span className="text-gray-800">
                  {ticked}/{phase.goals.length} ({goalPercent}%)
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${goalPercent}%`, backgroundColor: isComplete ? EMERALD : accent }}
                />
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Goals</p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {phase.goals.map((g, i) => {
                  const key = roadmapGoalKey(phase.phase_number, i);
                  const isDone = completedGoals.has(key);
                  const tick = onToggleGoal ? () => onToggleGoal(key) : undefined;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={tick}
                      disabled={!tick}
                      aria-pressed={isDone}
                      className={`flex w-full items-start gap-2.5 rounded-xl border border-transparent p-2 text-left transition-all ${
                        tick ? "cursor-pointer hover:border-gray-200 hover:bg-white" : "cursor-default"
                      }`}
                    >
                      <span
                        style={isDone ? { borderColor: accent, backgroundColor: accent } : undefined}
                        className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[4px] border ${
                          isDone ? "text-white" : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span
                        className={`text-xs ${isDone ? "font-normal text-gray-400 line-through" : "font-medium text-gray-800"}`}
                      >
                        {g}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {phase.suggested_activities.length > 0 && (
          <div className="mb-4 rounded-2xl border border-gray-200/80 bg-white p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Suggested activities
            </p>
            <ul className="list-inside list-disc space-y-1 text-xs font-medium text-gray-600">
              {phase.suggested_activities.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3">
        {isCurrent ? (
          isLastPhase ? (
            <p className="py-1 text-center text-[11px] font-semibold text-gray-500">
              Final phase — take your time with it.
            </p>
          ) : confirming ? (
            <div className="space-y-2">
              {nextTitle && (
                <p className="text-[11px] text-gray-500">
                  Next up: <span className="font-semibold text-gray-700">{nextTitle}</span>
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={onCancelConfirm}
                  className="flex-1 cursor-pointer rounded-xl bg-gray-100 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={advancing}
                  style={{ backgroundColor: accent }}
                  className="flex-1 cursor-pointer rounded-xl py-1.5 text-[11px] font-bold text-white transition-all hover:shadow-md disabled:opacity-50"
                >
                  {advancing ? "Advancing…" : "Confirm"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onStartConfirm}
              style={{ backgroundColor: accent }}
              className="w-full cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md"
            >
              Complete phase &amp; advance →
            </button>
          )
        ) : isComplete ? (
          <p className="flex items-center justify-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 py-1 text-[11px] font-bold text-emerald-700">
            <Check className="h-3 w-3" /> Phase complete
          </p>
        ) : (
          <p className="py-1 text-center text-[11px] font-semibold text-gray-400">Upcoming phase</p>
        )}
      </div>
    </div>
  );
}
