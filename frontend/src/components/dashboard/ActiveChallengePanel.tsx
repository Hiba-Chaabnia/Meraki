"use client";

import { ChallengeDetails } from "./ChallengeDetails";
import { SwapChallengeButton } from "./SwapChallengeButton";
import { difficultyConfig } from "@/lib/dashboardData";
import type { Challenge } from "@/lib/dashboardData";

export interface ActiveChallengePanelProps {
  challenge: Challenge;
  /** Hands over to the session logger; the page completes it once a session saves. */
  onLogAndComplete: (challenge: Challenge) => void;
  /** A swap is in flight — completing waits for it. */
  busy?: boolean;
  /** Reject this one and generate a replacement. Omitted hides the action. */
  onSwap?: (challenge: Challenge) => void;
  /** A refused swap, including the daily-limit refusal. */
  swapError?: string | null;
  onDismissSwapError?: () => void;
  /** Hours until the next swap is allowed, from the hobby's own skip dates. */
  swapCooldownHours?: number;
}

/**
 * The challenge you are on, open on the page.
 *
 * `ChallengeModal`'s body minus the modal: on the hobby page the active
 * challenge is the thing you came for, and putting its skills, tips and both
 * actions behind a click made the page's headline content the one part of it
 * you could not read.
 *
 * Only ever renders an active challenge. Completed and swapped-out ones still
 * open in `ChallengeModal` from the archive, where a click is the right cost.
 */
export function ActiveChallengePanel({
  challenge: c,
  onLogAndComplete,
  busy = false,
  onSwap,
  swapError,
  onDismissSwapError,
  swapCooldownHours = 0,
}: ActiveChallengePanelProps) {
  const diff = difficultyConfig[c.difficulty];

  /* No max-width: the panel is sized by its 7/12 column. A `max-w-2xl` here
     left ~190px of dead canvas between it and the archive, which read as the
     two blocks being unrelated rather than a pair. */
  return (
    <div className="relative flex h-full w-full flex-col rounded-2xl bg-white shadow-xl">
      <div className="flex flex-1 flex-col p-6 md:p-8">
        {/* The section label and the swap live on the card, not above it — the
            card is the section. */}
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <p className="card-heading">Current Challenge</p>
          {onSwap && (
            <SwapChallengeButton
              onSwap={() => onSwap(c)}
              busy={busy}
              error={swapError}
              onDismissError={onDismissSwapError}
              cooldownHours={swapCooldownHours}
            />
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="page-title min-w-0 flex-1">{c.title}</h2>

            <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-3 pt-1.5">
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

              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {c.estimatedTime}
              </span>
            </div>
          </div>

          <p className="mt-2 text-gray-600">{c.description}</p>
        </div>

        <div className="flex-1">
          <ChallengeDetails challenge={c} />
        </div>

        <div className="mt-6 flex justify-end pt-2">
          {/* One completion path — logging the session is the only thing that
              makes a challenge true. See ChallengeModal for why. */}
          <button
            onClick={() => onLogAndComplete(c)}
            disabled={busy}
            className="cursor-pointer rounded-xl bg-gray-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            Complete challenge &amp; log session
          </button>
        </div>
      </div>
    </div>
  );
}
