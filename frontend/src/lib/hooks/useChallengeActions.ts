"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeChallenge,
  triggerChallengeGeneration,
  pollChallengeGenStatus,
  swapChallenge,
} from "@/app/actions/challenges";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import type { Challenge } from "@/lib/dashboardData";

const POLL_INTERVAL_MS = 2500;

export interface ChallengeActions {
  /** The challenge currently open in the modal, or null. */
  open: Challenge | null;
  openChallenge: (challenge: Challenge) => void;
  close: () => void;
  generatingNext: boolean;
  generateNext: (challenge: Challenge) => Promise<void>;
  /** Reject it and generate a replacement. One per hobby per day. */
  swap: (challenge: Challenge) => Promise<void>;
  /**
   * Set when "Log & complete" was pressed, cleared once the session saves.
   *
   * A challenge is only ever completed by logging a session against it, so the
   * page has to carry the intent from the modal through to its save handler —
   * see `completeAfterSession`.
   */
  pendingCompletion: Challenge | null;
  /** Call from the page's save handler once a session has been created. */
  completeAfterSession: () => Promise<void>;
  beginCompletion: (challenge: Challenge) => void;
  /** A refused write — the modal shows it in place. */
  error: string | null;
}

/**
 * The challenge modal's state and writes, shared by every surface that shows a
 * challenge card. In a hook rather than each page because four surfaces open
 * the same modal and all four need identical behaviour.
 *
 * @param onChanged Refetch for the host page, called after any write lands.
 */
export function useChallengeActions(onChanged: () => void): ChallengeActions {
  const [open, setOpen] = useState<Challenge | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<Challenge | null>(null);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const close = useCallback(() => { setOpen(null); setError(null); }, []);

  /** Poll a generation job, then refetch once. */
  const watchJob = useCallback(
    (jobId: string) => {
      pollRef.current = setInterval(async () => {
        const s = await pollChallengeGenStatus(jobId);
        if (s.status === "completed" || s.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setGeneratingNext(false);
          setOpen(null);
          onChanged();
        }
      }, POLL_INTERVAL_MS);
    },
    [onChanged],
  );

  const generateNext = useCallback(
    async (challenge: Challenge) => {
      if (generatingNext) return;
      setGeneratingNext(true);
      setError(null);
      const { job_id, error: genError } = await triggerChallengeGeneration(challenge.hobbySlug);
      if (!job_id) {
        setGeneratingNext(false);
        setError(genError ?? "Could not generate a challenge.");
        return;
      }
      watchJob(job_id);
    },
    [generatingNext, watchJob],
  );

  const swap = useCallback(
    async (challenge: Challenge) => {
      if (generatingNext) return;
      setGeneratingNext(true);
      setError(null);
      const res = await swapChallenge(challenge.id, challenge.hobbySlug);
      if (!res.job_id) {
        setGeneratingNext(false);
        setError(
          res.retryAfterHours && res.error
            ? `${res.error} Try again in ${res.retryAfterHours}h.`
            : res.error ?? "Could not swap this challenge.",
        );
        return;
      }
      watchJob(res.job_id);
    },
    [generatingNext, watchJob],
  );

  /* Completion is a two-step: the modal records the intent and hands over to
     the session logger, and the page calls back here once a session exists.
     There is no way to complete a challenge without one — "Mark as done" used
     to allow it, and it inflated challengesCompleted with practice that never
     happened. */
  const beginCompletion = useCallback((challenge: Challenge) => {
    setPendingCompletion(challenge);
    setOpen(null);
  }, []);

  const completeAfterSession = useCallback(async () => {
    const challenge = pendingCompletion;
    if (!challenge) return;
    setPendingCompletion(null);

    const res = await completeChallenge(challenge.id);
    if (res?.error) {
      console.error("[Challenge] Failed to complete:", res.error);
      return;
    }
    checkAndAwardMilestones().catch((e) =>
      console.error("[Challenge] Milestone check failed:", e),
    );
    onChanged();
  }, [pendingCompletion, onChanged]);

  return {
    open,
    openChallenge: (c: Challenge) => { setError(null); setOpen(c); },
    close,
    generatingNext,
    generateNext,
    swap,
    pendingCompletion,
    completeAfterSession,
    beginCompletion,
    error,
  };
}
