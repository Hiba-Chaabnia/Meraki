"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { saveHobbyMatches } from "@/app/actions/quiz";
import {
  triggerDiscovery,
  pollDiscoveryStatus,
  DiscoveryStatusResponse,
} from "@/app/actions/discovery";
import { hobbyMeta } from "@/lib/hobbyData";

interface MatchCard {
  slug: string;
  name: string;
  tagline: string;
  matchPercent: number;
  color: string;
  lightColor: string;
  tags: string[];
}

export default function AnalyzingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Starting analysis...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let pollingTimer: NodeJS.Timeout | null = null;

    function stopPolling() {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }

    function startPolling(jobId: string) {
      console.log("[Analyzing] Starting polling for job:", jobId);
      pollingTimer = setInterval(async () => {
        if (!mounted) return;

        const pollResult = await pollDiscoveryStatus(jobId);
        console.log("[Analyzing] Poll result:", pollResult);

        if (!("status" in pollResult)) {
          console.error("[Analyzing] Poll error:", pollResult.error);
          setError(pollResult.error);
          stopPolling();
          return;
        }

        const response = pollResult as DiscoveryStatusResponse;

        switch (response.status) {
          case "pending":
            setStatus("Waiting for analysis to start...");
            break;
          case "running":
            setStatus("Finding your perfect hobbies...");
            break;
          case "completed":
            stopPolling();
            console.log("[Analyzing] Job completed, matches:", response.result?.matches?.length);
            // Clear the job ID so future quiz attempts start fresh
            try { sessionStorage.removeItem("discovery-job-id"); } catch { }

            if (response.result?.matches && response.result.matches.length > 0) {
              // Save matches to Supabase (fire-and-forget)
              const matchesToSave = response.result.matches.map((m) => ({
                hobbySlug: m.hobby_slug,
                matchPercentage: m.match_percentage,
                matchTags: m.match_tags,
                reasoning: m.reasoning,
              }));
              saveHobbyMatches(matchesToSave).catch((e) =>
                console.error("[Analyzing] Failed to save matches to DB:", e)
              );

              // Convert to card format and cache
              const cards: MatchCard[] = response.result.matches.map((m) => {
                const meta = hobbyMeta[m.hobby_slug];
                return {
                  slug: m.hobby_slug,
                  name: meta?.name ?? m.hobby_slug,
                  tagline: m.reasoning || "A great match for you!",
                  matchPercent: m.match_percentage,
                  color: meta?.color ?? "#B8A9E8",
                  lightColor: meta?.lightColor ?? "#E8E2F7",
                  tags: m.match_tags ?? [],
                };
              });

              try {
                sessionStorage.setItem("quiz-matches", JSON.stringify(cards));
              } catch { /* quota exceeded */ }

              if (mounted) {
                router.replace("/discover/quiz/results");
              }
            } else {
              // No matches — navigate to results which will show "No Matches Yet"
              if (mounted) {
                router.replace("/discover/quiz/results");
              }
            }
            break;
          case "failed":
            stopPolling();
            try { sessionStorage.removeItem("discovery-job-id"); } catch { }
            setError(response.error || "Analysis failed");
            break;
        }
      }, 2000);
    }

    async function start() {
      // Check for an existing in-progress job (e.g. page refresh mid-poll)
      try {
        const existingJobId = sessionStorage.getItem("discovery-job-id");
        if (existingJobId) {
          console.log("[Analyzing] Resuming existing job:", existingJobId);
          setStatus("Resuming analysis...");
          startPolling(existingJobId);
          return;
        }
      } catch { /* sessionStorage unavailable */ }

      // No existing job — trigger a new one
      console.log("[Analyzing] Starting discovery...");
      const result = await triggerDiscovery();

      // Always persist job ID so a StrictMode remount can resume polling
      if (result.job_id) {
        try { sessionStorage.setItem("discovery-job-id", result.job_id); } catch { }
      }

      if (!mounted) return;

      if (result.error) {
        console.error("[Analyzing] Discovery error:", result.error);
        setError(result.error);
        return;
      }

      if (result.job_id) {
        console.log("[Analyzing] Got job_id:", result.job_id);
        setStatus("Analyzing your quiz responses...");
        startPolling(result.job_id);
      }
    }

    start();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-6"
      >
        <div className="w-16 h-16 border-4 border-[var(--lavender)] border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="!text-2xl md:!text-3xl">Analyzing Your Profile</h1>
        <p className="text-gray-500">{status}</p>
        {error && (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <Link
              href="/discover/quiz"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "var(--lavender)" }}
            >
              Retake the Quiz
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
