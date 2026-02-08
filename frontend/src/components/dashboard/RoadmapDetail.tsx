"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, ChevronDown } from "lucide-react";
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
}

/**
 * The whole path, one phase per row.
 *
 * Was a page (`/dashboard/roadmap/[slug]`); it is now the body of
 * `RoadmapModal`, opened from the hobby page. A roadmap belongs to exactly one
 * hobby and had exactly one link into it, so the route bought a navigation and
 * a second copy of the header.
 *
 * **Every phase can be opened, including ones you have not reached.** The page
 * version showed future phases as a title and a weekly time estimate with their
 * goals and activities withheld, on the reasoning that a roadmap should not
 * spoil itself. But the question this answers is "what am I signing up for" —
 * withholding the answer for everything past the current stage left the plan
 * legible only in the order you walk it.
 *
 * Rows collapse instead: complete ones fold to a title and a tick, the current
 * one opens on mount, and the rest open on click. Six phases of goals and
 * activities expanded at once is a wall.
 */
export function RoadmapDetail({
  roadmap,
  advancing = false,
  error,
  onAdvance,
  onToggleGoal,
}: RoadmapDetailProps) {
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [openPhase, setOpenPhase] = useState<number | null>(roadmap.currentPhase);
  const done = new Set(roadmap.completedGoals);

  const nextPhase = roadmap.phases[roadmap.currentPhase + 1];
  const isLastPhase = roadmap.currentPhase >= roadmap.totalPhases - 1;
  const percent = ((roadmap.currentPhase + 1) / roadmap.totalPhases) * 100;

  const handleConfirm = () => {
    setConfirmAdvance(false);
    onAdvance();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
          {roadmap.hobbyName}
        </span>
        <h2 className="page-title mt-3 mb-1.5">{roadmap.title}</h2>
        <p className="body-sm">{roadmap.description}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>Phase {roadmap.currentPhase + 1} of {roadmap.totalPhases}</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-700 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {roadmap.phases.map((phase, idx) => (
          <PhaseRow
            key={idx}
            phase={phase}
            isComplete={idx < roadmap.currentPhase}
            isCurrent={idx === roadmap.currentPhase}
            isOpen={openPhase === idx}
            onToggleOpen={() => setOpenPhase((p) => (p === idx ? null : idx))}
            completedGoals={done}
            onToggleGoal={
              onToggleGoal && roadmap.userRoadmapId
                ? (key) => onToggleGoal(roadmap.userRoadmapId, key)
                : undefined
            }
          />
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLastPhase && (
        <div className="mt-6 text-center">
          {confirmAdvance ? (
            <div className="inline-block w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
              <p className="mb-1 text-sm font-semibold text-gray-800">
                Complete Phase {roadmap.currentPhase + 1}?
              </p>
              {nextPhase && (
                <p className="mb-4 text-sm text-gray-500">
                  You&apos;ll move on to <span className="font-medium text-gray-700">{nextPhase.title}</span>.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAdvance(false)}
                  className="flex-1 cursor-pointer rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={advancing}
                  className="flex-1 cursor-pointer rounded-xl bg-gray-700 py-2 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {advancing ? "Advancing..." : "Confirm"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAdvance(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]"
            >
              Complete Phase {roadmap.currentPhase + 1} &amp; Advance
            </button>
          )}
        </div>
      )}

      {isLastPhase && (
        <div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            You&rsquo;re on the final phase — take your time with it.
          </p>
        </div>
      )}
    </div>
  );
}

interface PhaseRowProps {
  phase: RoadmapPhase;
  isComplete: boolean;
  isCurrent: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  completedGoals: Set<string>;
  onToggleGoal?: (goalKey: string) => void;
}

function PhaseRow({
  phase,
  isComplete,
  isCurrent,
  isOpen,
  onToggleOpen,
  completedGoals,
  onToggleGoal,
}: PhaseRowProps) {
  const ticked = phase.goals.filter((_, i) => completedGoals.has(roadmapGoalKey(phase.phase_number, i))).length;

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        isCurrent ? "border-gray-700 shadow-md" : isComplete ? "border-gray-200 bg-gray-50/50" : "border-gray-100"
      }`}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-3 p-5 text-left"
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isComplete ? "bg-green-100 text-green-600" : isCurrent ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          {isComplete ? <Check className="h-4 w-4" /> : phase.phase_number}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${isCurrent || isComplete ? "text-gray-800" : "text-gray-500"}`}>
            {phase.title}
          </p>
          <p className="caption">
            {phase.time_per_week}/week
            {phase.goals.length > 0 && ` · ${ticked}/${phase.goals.length} goals`}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5 pl-16"
        >
          <p className="mb-4 text-sm text-gray-500">{phase.description}</p>

          {phase.goals.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">Goals</p>
              <ul className="space-y-1">
                {phase.goals.map((g, i) => {
                  const key = roadmapGoalKey(phase.phase_number, i);
                  const isDone = completedGoals.has(key);
                  const tick = onToggleGoal ? () => onToggleGoal(key) : undefined;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <button
                        type="button"
                        onClick={tick}
                        disabled={!tick}
                        aria-pressed={isDone}
                        className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                          isDone ? "border-gray-700 bg-gray-700 text-white" : "border-gray-300 bg-white text-transparent"
                        } ${tick ? "cursor-pointer active:scale-95" : "cursor-default"}`}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </button>
                      <span className={isDone ? "text-gray-400 line-through" : "text-gray-600"}>{g}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {phase.suggested_activities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">Activities</p>
              <ul className="space-y-1">
                {phase.suggested_activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
