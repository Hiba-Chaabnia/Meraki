"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { FlowerSpinner } from "@/components/ui/FlowerSpinner";
import { AnalyzingSteps } from "@/components/discover/quiz/AnalyzingSteps";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { saveHobbyMatches } from "@/app/actions/quiz";
import {
  triggerDiscovery,
  pollDiscoveryStatus,
  DiscoveryStatusResponse,
} from "@/app/actions/discovery";
import { DISCOVERY_STEPS } from "@/lib/discovery";
import { formatSlug } from "@/lib/hobbyData";

const stagger = staggerContainer(0.08);

const POLL_INTERVAL_MS = 2_000;
/** Give up rather than spin forever if the job never reports back. */
const MAX_WAIT_MS = 150_000;
/**
 * Past this, reassure the user that a slow run is still a healthy run.
 *
 * Needs calibrating against real timings: the message claims the run is taking
 * "longer than usual", so this must sit ABOVE the typical completion time or it
 * fires on every normal run and means nothing. 45s is a placeholder — set it
 * from observed p50 once you have numbers.
 */
const SLOW_AFTER_MS = 45_000;

const JOB_KEY = "discovery-job-id";

export default function AnalyzingPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  /** Bumping this re-runs the whole effect — that's the retry mechanism. */
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    try {
      sessionStorage.removeItem(JOB_KEY);
    } catch {
      /* sessionStorage unavailable */
    }
    setError(null);
    setSlow(false);
    setCompletedSteps(0);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    const deadline = Date.now() + MAX_WAIT_MS;

    function stopPolling() {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }

    function fail(message: string) {
      stopPolling();
      try {
        sessionStorage.removeItem(JOB_KEY);
      } catch {
        /* sessionStorage unavailable */
      }
      // The UI shows a generic message, so this is the only record of what
      // actually broke — always log it.
      console.error("[Analyzing] Job failed:", message);
      if (mounted) setError(message);
    }

    function handleCompleted(response: DiscoveryStatusResponse) {
      stopPolling();
      try {
        sessionStorage.removeItem(JOB_KEY);
      } catch {
        /* sessionStorage unavailable */
      }

      const matches = response.result?.matches ?? [];
      console.log("[Analyzing] Job completed, matches:", matches.length);

      if (mounted) setCompletedSteps(DISCOVERY_STEPS.length);

      if (matches.length > 0) {
        // Backup write — the backend is the primary writer for these
        saveHobbyMatches(
          matches.map((m) => ({
            hobbySlug: m.hobby_slug,
            matchPercentage: m.match_percentage,
            matchTags: m.match_tags,
            reasoning: m.reasoning,
          }))
        ).catch((e) =>
          console.error("[Analyzing] Failed to save matches to DB:", e)
        );

        try {
          sessionStorage.setItem(
            "quiz-matches",
            JSON.stringify(
              matches.map((m) => ({
                slug: m.hobby_slug,
                name: formatSlug(m.hobby_slug),
                tagline: m.reasoning || "A great match for you!",
                matchPercent: m.match_percentage,
                tags: m.match_tags ?? [],
              }))
            )
          );
        } catch {
          /* quota exceeded */
        }
      }

      // Either way results/ decides what to render — it shows NoMatchesState
      // when the list is empty.
      if (mounted) router.replace("/discover/quiz/results");
    }

    function startPolling(jobId: string) {
      console.log("[Analyzing] Starting polling for job:", jobId);
      pollingTimer = setInterval(async () => {
        if (!mounted) return;

        if (Date.now() > deadline) {
          fail("This is taking longer than expected.");
          return;
        }

        const pollResult = await pollDiscoveryStatus(jobId);
        if (!mounted) return;

        if (!("status" in pollResult)) {
          console.error("[Analyzing] Poll error:", pollResult.error);
          fail(pollResult.error);
          return;
        }

        const response = pollResult as DiscoveryStatusResponse;
        setCompletedSteps(response.progress ?? 0);

        switch (response.status) {
          // `pending` and `running` look the same to the user: step 1 stays
          // active until the crew reports its first finished task.
          case "pending":
          case "running":
            break;
          case "completed":
            handleCompleted(response);
            break;
          case "failed":
            fail(response.error || "Analysis failed");
            break;
        }
      }, POLL_INTERVAL_MS);
    }

    async function start() {
      slowTimer = setTimeout(() => {
        if (mounted) setSlow(true);
      }, SLOW_AFTER_MS);

      // Resume an in-flight job (e.g. refresh mid-poll, or a StrictMode remount)
      try {
        const existingJobId = sessionStorage.getItem(JOB_KEY);
        if (existingJobId) {
          console.log("[Analyzing] Resuming existing job:", existingJobId);
          startPolling(existingJobId);
          return;
        }
      } catch {
        /* sessionStorage unavailable */
      }

      console.log("[Analyzing] Starting discovery...");
      const result = await triggerDiscovery();

      // Persist before the mounted check so a remount can always resume
      if (result.job_id) {
        try {
          sessionStorage.setItem(JOB_KEY, result.job_id);
        } catch {
          /* sessionStorage unavailable */
        }
      }

      if (!mounted) return;

      if (result.error) {
        console.error("[Analyzing] Discovery error:", result.error);
        setError(result.error);
        return;
      }

      if (result.job_id) {
        startPolling(result.job_id);
      }
    }

    start();

    return () => {
      mounted = false;
      stopPolling();
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, [router, attempt]);

  /* ── Failure ──
     A terminal state, so it drops the loading furniture entirely: no spinner,
     no "Finding your…" headline, no motion. Mirrors app/discover/error.tsx —
     heading, one plain sentence, two actions. The underlying error is logged,
     not shown; raw backend strings aren't user-facing anywhere else either. */
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex justify-center"
        >
          <ErrorState
            message="Match failed. Your answers are saved. Please try again."
            actions={
              <>
                <Button onClick={retry} variant="secondary">
                  Try again
                </Button>
                <Button href="/discover/quiz" variant="ghost">
                  Retake the quiz
                </Button>
              </>
            }
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="text-center max-w-md w-full"
      >
        <motion.div variants={fadeUp} className="flex justify-center mb-8">
          <FlowerSpinner size={72} color="var(--secondary)" />
        </motion.div>

        <motion.h1 variants={fadeUp} className="page-title mb-6">
          Finding your <em>creative</em> match
        </motion.h1>

        <motion.div variants={fadeUp}>
          {/* Always `running` here: this branch only renders while work is
              underway, and "Reading your answers" is honest from the moment
              we mount — triggerDiscovery() is literally fetching them. */}
          <AnalyzingSteps
            steps={DISCOVERY_STEPS}
            completed={completedSteps}
            running
          />
        </motion.div>

        <motion.p variants={fadeUp} className="caption mt-6">
          {slow
            ? "Still working — this one's taking a little longer than usual."
            : "Good matches take a moment."}
        </motion.p>
      </motion.div>
    </div>
  );
}
