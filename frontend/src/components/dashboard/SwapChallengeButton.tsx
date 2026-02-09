"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

export interface SwapChallengeButtonProps {
  onSwap: () => void;
  /** A swap already in flight. */
  busy?: boolean;
  /**
   * A refused swap, including the daily-limit refusal. Shown as a popover on
   * the button rather than a strip inside the card, so the warning lands where
   * the click did.
   */
  error?: string | null;
  /** Dismisses `error`. Omitted leaves the popover until the next attempt. */
  onDismissError?: () => void;
  /** Hours until the next swap is allowed. 0 means it is available now. */
  cooldownHours?: number;
}

/**
 * Reject the active challenge and generate a replacement.
 *
 * The cooldown is enforced server-side and *also* read on the client, from the
 * skip dates already on the page. The button greys out rather than spending a
 * click to be told no. The server stays the authority — a swap in another tab
 * leaves this copy stale, which is why pressing it still reports the refusal
 * in the popover rather than assuming the greying is complete.
 */
export function SwapChallengeButton({
  onSwap,
  busy = false,
  error,
  onDismissError,
  cooldownHours = 0,
}: SwapChallengeButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const spent = cooldownHours > 0;

  useEffect(() => {
    if (!error || !onDismissError) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onDismissError();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismissError();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [error, onDismissError]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={onSwap}
        disabled={busy || spent}
        title={spent ? `Another swap in ${cooldownHours}h` : undefined}
        aria-describedby={error ? "swap-refused" : undefined}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors enabled:cursor-pointer enabled:hover:border-gray-300 enabled:hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Finding another…" : spent ? `Swap in ${cooldownHours}h` : "Swap challenge"}
      </button>

      {error && (
        <div
          id="swap-refused"
          role="alert"
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-lg"
        >
          <p className="text-sm text-gray-700">{error}</p>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="mt-3 cursor-pointer text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700"
            >
              Got it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
