"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerRoadmapGeneration, pollRoadmapStatus } from "@/app/actions/roadmap";

/* ─── Module-level cache ───
   Survives unmount/remount during client-side navigation, so leaving the
   dashboard mid-generation and coming back resumes the poll instead of
   orphaning the job. sessionStorage is the secondary tier — it survives a
   full refresh, which the module cache does not. */
const jobIdCache = new Map<string, string>();

const JOB_KEY_PREFIX = "roadmap-job-";
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

export interface RoadmapGeneration {
  /** Kick off generation for one hobby. Ignored if that hobby is already running. */
  generate: (hobbySlug: string) => void;
  /** Slugs with a job in flight — the cards render their generating state from this. */
  generatingSlugs: Set<string>;
  /** Slug → message, for the ones that failed. Cleared when that slug retries. */
  errors: Record<string, string>;
}

/**
 * Roadmap generation, keyed by hobby slug so several cards can run at once.
 *
 * The dashboard needs this because a hobby added from the dashboard lands with
 * no roadmap, and the row's only previous answer was "open the hobby to build
 * one". The equivalent logic on the hobby page is inline, leaks its interval on
 * unmount, and swallows both failure paths; this fixes all three.
 *
 * There is no progress to report: the backend attaches its task callback to
 * discovery only, and the roadmap crew is a single task — so the generating
 * state is deliberately indeterminate.
 *
 * @param onComplete Called once per job that finishes, successfully or not —
 *   the page passes its refetch, which is what swaps the card for a real one.
 */
export function useRoadmapGeneration(onComplete: () => void): RoadmapGeneration {
  const [generatingSlugs, setGeneratingSlugs] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const timersRef = useRef(new Map<string, ReturnType<typeof setInterval>>());
  // Kept in a ref so a new callback identity never restarts a poll. Written in
  // an effect rather than during render — a poll only ever fires after commit,
  // so it always sees the latest value anyway.
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
          const status = await pollRoadmapStatus(jobId);
          if (status.status === "completed") {
            markSettled(slug);
          } else if (status.status === "failed") {
            markSettled(slug, status.error || "Couldn't build the roadmap just now.");
          }
        } catch (e) {
          console.error("[RoadmapGeneration] Poll failed:", e);
          markSettled(slug, "Lost contact while building the roadmap.");
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

      triggerRoadmapGeneration(hobbySlug)
        .then(({ job_id, error }) => {
          if (!job_id) {
            markSettled(hobbySlug, error || "Couldn't start the roadmap build.");
            return;
          }
          beginPoll(hobbySlug, job_id);
        })
        .catch((e) => {
          console.error("[RoadmapGeneration] Trigger failed:", e);
          markSettled(hobbySlug, "Couldn't reach the roadmap service.");
        });
    },
    [markSettled, beginPoll],
  );

  /* Resume anything already in flight — a refresh mid-build would otherwise
     leave the job running server-side with nothing watching it. */
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
      // table, via sessionStorage) is exactly the case the rule's own guidance
      // exempts. A lazy useState initialiser would avoid the effect but read
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
