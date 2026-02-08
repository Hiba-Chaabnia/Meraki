"use client";

import { Modal } from "@/components/ui/Modal";
import { ChallengeDetails } from "./ChallengeDetails";
import { difficultyConfig } from "@/lib/dashboardData";
import type { Challenge } from "@/lib/dashboardData";
import { ClockIcon, SparkleIcon, XIcon } from "@/components/ui/Icons";

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export interface ChallengeModalProps {
  challenge: Challenge | null;
  onClose: () => void;
  generatingNext?: boolean;
  /** Hands over to the session logger; the page completes it once a session saves. */
  onLogAndComplete: (challenge: Challenge) => void;
  onGenerateNext: (challenge: Challenge) => void;
  /** Reject this challenge and generate a replacement. Omitted hides the action. */
  onSwap?: (challenge: Challenge) => void;
  /** A refused write — shown in place rather than swallowed. */
  error?: string | null;
}

/**
 * A challenge, opened in place from whichever card you clicked.
 *
 * Replaces `/dashboard/challenges/[id]`. That route held the crew's `skills`,
 * `tips` and `what_youll_learn` plus the only completion actions, so it could
 * not simply be deleted — but nothing about it needed to be a page. Nothing is
 * shared outward from this product (Settings: no public profiles, feeds or
 * followers), so a per-challenge URL bought only bookmarking, at the cost of a
 * route reachable five different ways.
 */
export function ChallengeModal({
  challenge,
  onClose,
  generatingNext = false,
  onLogAndComplete,
  onGenerateNext,
  onSwap,
  error,
}: ChallengeModalProps) {
  const isOpen = challenge !== null;
  // Held so the exit animation has something to render while closing.
  const c = challenge;
  const diff = c ? difficultyConfig[c.difficulty] : null;
  const isCompleted = c?.status === "completed";
  const isSkipped = c?.status === "skipped";

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" scrollable>
      {c && diff && (
        <div className="p-6 md:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                  {c.hobbyName}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${i >= diff.dots ? "bg-gray-200" : ""}`}
                        style={i < diff.dots ? { backgroundColor: diff.color } : undefined}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{diff.label}</span>
                </div>
              </div>
              <h2 className="page-title mb-2">{c.title}</h2>
              <p className="text-gray-600">{c.description}</p>
              <div className="mt-3 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" /> {c.estimatedTime}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <CheckCircleIcon className="h-4 w-4" /> Completed
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <ChallengeDetails challenge={c} />

          {error && (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6">
            {isSkipped ? (
              /* You swapped this one out. Readable, but not resumable — a
                 replacement was generated in its place. */
              <p className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                You swapped this one out. It is kept so the next challenge can avoid
                repeating it.
              </p>
            ) : isCompleted ? (
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <SparkleIcon className="mx-auto mb-3 h-9 w-9 text-gray-700" />
                <p className="mb-1 text-lg font-medium text-gray-900">Challenge complete</p>
                <p className="mx-auto mb-4 max-w-md text-sm text-gray-500">
                  Great work on finishing this. Your growth is showing!
                </p>
                <button
                  onClick={() => onGenerateNext(c)}
                  disabled={generatingNext}
                  className="cursor-pointer rounded-xl bg-gray-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {generatingNext ? "Generating..." : "Generate next challenge"}
                </button>
              </div>
            ) : (
              <>
                {/* One completion path. "Mark as done" used to sit beside this
                    and complete without a session, which inflated
                    challengesCompleted with practice that never happened —
                    logging the session is the only thing that makes it true. */}
                <button
                  onClick={() => onLogAndComplete(c)}
                  className="w-full cursor-pointer rounded-xl bg-gray-700 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  Log a session &amp; complete this
                </button>

                {/* The honest exit. Without it the only way out of a challenge
                    you do not want is "Mark as done", which would claim you did
                    it — and that count feeds the Progress page and the
                    challenge-champion milestone. */}
                {onSwap && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => onSwap(c)}
                      disabled={generatingNext}
                      className="cursor-pointer text-sm text-gray-400 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-700 disabled:opacity-50"
                    >
                      {generatingNext ? "Finding another…" : "Not this one — swap it"}
                    </button>
                    <p className="caption mt-1">One swap per hobby per day.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
