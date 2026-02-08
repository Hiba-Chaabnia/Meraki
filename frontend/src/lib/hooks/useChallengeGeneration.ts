"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerChallengeGeneration, pollChallengeGenStatus } from "@/app/actions/challenges";

/* ─── Module-level cache ───
   Survives unmount/remount during client-side navigation; sessionStorage is
   the second tier, surviving a full refresh. See the note on `generate` for
   why an unwatched job is worse here than a wasted poll. */
const jobIdCache = new Map<string, string>();

const JOB_KEY_PREFIX = "challenge-job-";
const POLL_INTERVAL_MS = 2500;

function rememberJob(slug: string, jobId: string) {
  jobIdCache.set(slug, jobId);
  try {
    sessionStorage.setItem(`${JOB_KEY_PREFIX}${slug}`, jobId);
  } catch {
    /* quota exceeded — the module cache is still the primary */
  }
}

function forgetJob(slug: string) {
  jobIdCache.delete(slug);
  try {
    sessionStorage.removeItem(`${JOB_KEY_PREFIX}${slug}`);
  } catch {
    /* nothing to do */
  }
}

/** Every slug with a job id still on record, from either tier. */
function pendingSlugs(): string[] {
  const slugs = new Set(jobIdCache.keys());
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(JOB_KEY_PREFIX)) slugs.add(key.slice(JOB_KEY_PREFIX.length));
    }
  } catch {
    /* sessionStorage unavailable — module cache only */
  }
  return [...slugs];
}

export interface ChallengeGeneration {
  /** Kick off generation for one hobby. Ignored if that hobby is already running. */
  generate: (hobbySlug: string) => void;
  /** Slugs with a job in flight. */
  generatingSlugs: Set<string>;
  /** Slug → message, for the ones that failed. Cleared when that slug retries. */
  errors: Record<string, string>;
}

/**
 * Challenge generation, keyed by hobby slug — the roadmap hook's shape, applied
 * to the one generation flow that still lived inline in a page.
 *
 * The page held its interval in a `useRef` and its in-flight state in a
 * boolean, both of which die on unmount with nothing written anywhere. That was
 * not merely untidy. Generation is a ~90-second crew run; navigate away and
 * back mid-build and the page offered "Generate a Challenge" as though nothing
 * were happening. The server-side guard only refuses when a row is already
 * `active`, and during generation no row exists yet — so the second click was
 * accepted, and `save_generated_challenge` wrote both results as `active`.
 *
 * Two active challenges for one hobby is exactly what the guard exists to
 * prevent, and the state could not resolve itself: the backend's
 * `_skip_previous_active_challenges` was deliberately removed when skipping
 * became a user action, so nothing retires the loser. From then on the guard
 * blocked all generation for that hobby, and swapping could clear one challenge
 * per 24 hours.
 *
 * Making the job discoverable after a remount removes the second click.
 *
 * @param onComplete Called once per job that finishes, successfully or not.
 */
export function useChallengeGeneration(onComplete: () => void): ChallengeGeneration {
  const [generatingSlugs, setGeneratingSlugs] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const timersRef = useRef(new Map<string, ReturnType<typeof setInterval>>());
  // Kept in a ref so a new callback identity never restarts a poll.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopPolling = useCallback((slug: string) => {
    const timer = timersRef.current.get(slug);
    if (timer) clearInterval(timer);
    timersRef.current.delete(slug);
  }, []);

  const markSettled = useCallback(
    (slug: string, error?: string) => {
      stopPolling(slug);
      forgetJob(slug);
      setGeneratingSlugs((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      if (error) setErrors((prev) => ({ ...prev, [slug]: error }));
      onCompleteRef.current();
    },
    [stopPolling],
  );

  /** Timer setup only — callers own the `generatingSlugs` update. */
  const beginPoll = useCallback(
    (slug: string, jobId: string) => {
      if (timersRef.current.has(slug)) return;

      rememberJob(slug, jobId);

      const timer = setInterval(async () => {
        try {
          const status = await pollChallengeGenStatus(jobId);
          if (status.status === "completed") {
            markSettled(slug);
          } else if (status.status === "failed") {
            markSettled(slug, status.error || "Couldn't build a challenge just now.");
          }
        } catch (e) {
          console.error("[ChallengeGeneration] Poll failed:", e);
          markSettled(slug, "Lost contact while building the challenge.");
        }
      }, POLL_INTERVAL_MS);

      timersRef.current.set(slug, timer);
    },
    [markSettled],
  );

  const generate = useCallback(
    (hobbySlug: string) => {
      if (timersRef.current.has(hobbySlug)) return;

      setErrors((prev) => {
        if (!(hobbySlug in prev)) return prev;
        const next = { ...prev };
        delete next[hobbySlug];
        return next;
      });
      setGeneratingSlugs((prev) => new Set(prev).add(hobbySlug));

      triggerChallengeGeneration(hobbySlug)
        .then(({ job_id, error }) => {
          if (!job_id) {
            // Usually the active-challenge guard: both surfaces hide the button
            // while one is live, so reaching here means a stale page.
            markSettled(hobbySlug, error || "Couldn't start the challenge.");
            return;
          }
          beginPoll(hobbySlug, job_id);
        })
        .catch((e) => {
          console.error("[ChallengeGeneration] Trigger failed:", e);
          markSettled(hobbySlug, "Couldn't reach the challenge service.");
        });
    },
    [markSettled, beginPoll],
  );

  /* Resume anything already in flight. */
  useEffect(() => {
    const resumable: string[] = [];
    for (const slug of pendingSlugs()) {
      const jobId = jobIdCache.get(slug) ?? sessionStorage.getItem(`${JOB_KEY_PREFIX}${slug}`);
      if (jobId) {
        beginPoll(slug, jobId);
        resumable.push(slug);
      }
    }

    if (resumable.length > 0) {
      // Reading in-flight jobs out of an external system (the server's job
      // table, via sessionStorage) is the case the rule's own guidance exempts.
      // A lazy useState initialiser would avoid the effect but read
      // sessionStorage during SSR and mismatch on hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeneratingSlugs((prev) => new Set([...prev, ...resumable]));
    }

    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearInterval(timer);
      timers.clear();
    };
  }, [beginPoll]);

  return { generate, generatingSlugs, errors };
}
