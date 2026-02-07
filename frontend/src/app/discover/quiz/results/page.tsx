"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getHobbyMatches, saveHobbyMatches } from "@/app/actions/quiz";
import {
  triggerDiscovery,
  pollDiscoveryStatus,
  DiscoveryStatusResponse,
} from "@/app/actions/discovery";
import { hobbyMeta } from "@/lib/hobbyData";

interface HobbyMatchRow {
  hobby_id: string;
  match_percentage: number;
  match_tags: string[];
  reasoning: string;
  hobbies: {
    id: string;
    slug: string;
    name: string;
    [key: string]: unknown;
  };
}

interface MatchCard {
  slug: string;
  name: string;
  tagline: string;
  matchPercent: number;
  color: string;
  lightColor: string;
  tags: string[];
}

/* Placeholder matches used as fallback when no DB matches exist */
const PLACEHOLDER_MATCHES: MatchCard[] = [
  {
    slug: "pottery",
    name: "Pottery",
    tagline:
      "Get your hands dirty and create something beautiful from nothing but clay and intention.",
    matchPercent: 94,
    color: "#D4845A",
    lightColor: "#F2DCCF",
    tags: ["Tactile", "Meditative", "Solo-friendly"],
  },
  {
    slug: "watercolor",
    name: "Watercolor Painting",
    tagline:
      "Embrace happy accidents — watercolor rewards the bold and the patient alike.",
    matchPercent: 87,
    color: "#60B5FF",
    lightColor: "#AFDDFF",
    tags: ["Visual", "Portable", "Low mess"],
  },
  {
    slug: "knitting",
    name: "Knitting",
    tagline:
      "Rhythmic, portable, and surprisingly addictive — plus you get cozy things to wear.",
    matchPercent: 82,
    color: "#B8A9E8",
    lightColor: "#E8E2F7",
    tags: ["Repetitive", "Relaxing", "Practical"],
  },
];

function dbMatchToCard(row: HobbyMatchRow): MatchCard {
  const slug = row.hobbies?.slug ?? "";
  const meta = hobbyMeta[slug];
  return {
    slug,
    name: meta?.name ?? row.hobbies?.name ?? slug,
    tagline: row.reasoning || "A great match based on your quiz answers!",
    matchPercent: row.match_percentage,
    color: meta?.color ?? "#B8A9E8",
    lightColor: meta?.lightColor ?? "#E8E2F7",
    tags: row.match_tags ?? [],
  };
}

function AnalyzingPhase({ onComplete }: { onComplete: (matches: MatchCard[]) => void }) {
  const [status, setStatus] = useState<string>("Starting analysis...");
  const [error, setError] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startDiscovery() {
      console.log("[Results] Starting discovery...");
      // Start the discovery job
      const result = await triggerDiscovery();

      if (!mounted) return;

      if (result.error) {
        console.error("[Results] Discovery error:", result.error);
        setError(result.error);
        // Fallback to placeholders after a delay
        setTimeout(() => {
          if (mounted) onComplete(PLACEHOLDER_MATCHES);
        }, 2000);
        return;
      }

      if (result.job_id) {
        console.log("[Results] Got job_id:", result.job_id);
        jobIdRef.current = result.job_id;
        setStatus("Analyzing your quiz responses...");
        startPolling(result.job_id);
      }
    }

    function startPolling(jobId: string) {
      console.log("[Results] Starting polling for job:", jobId);
      pollingRef.current = setInterval(async () => {
        if (!mounted) return;

        const pollResult = await pollDiscoveryStatus(jobId);
        console.log("[Results] Poll result:", pollResult);

        if (!("status" in pollResult)) {
          // This is an error response from the catch block: { error: string }
          console.error("[Results] Poll error:", pollResult.error);
          setError(pollResult.error);
          stopPolling();
          setTimeout(() => {
            if (mounted) onComplete(PLACEHOLDER_MATCHES);
          }, 2000);
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
            console.log("[Results] Job completed, matches:", response.result?.matches?.length);
            if (response.result?.matches && response.result.matches.length > 0) {
              // Save matches to Supabase
              const matchesToSave = response.result.matches.map((m) => ({
                hobbySlug: m.hobby_slug,
                matchPercentage: m.match_percentage,
                matchTags: m.match_tags,
                reasoning: m.reasoning,
              }));
              console.log("[Results] Saving matches to Supabase...");
              await saveHobbyMatches(matchesToSave);

              // Convert to card format
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
              console.log("[Results] Displaying cards:", cards.length);
              onComplete(cards);
            } else {
              console.log("[Results] No matches, using placeholders");
              onComplete(PLACEHOLDER_MATCHES);
            }
            break;
          case "failed":
            stopPolling();
            setError(response.error || "Analysis failed");
            setTimeout(() => {
              if (mounted) onComplete(PLACEHOLDER_MATCHES);
            }, 2000);
            break;
        }
      }, 2000); // Poll every 2 seconds
    }

    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    startDiscovery();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [onComplete]);

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
          <p className="text-amber-500 text-sm">
            {error}. Using default recommendations...
          </p>
        )}
      </motion.div>
    </div>
  );
}

function MatchCard({ match, index }: { match: MatchCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/discover/sampling/${match.slug}?from=quiz`}
        className="block p-6 rounded-2xl border border-gray-200 hover:border-[var(--lavender)] transition-all hover:shadow-lg group"
        style={{ backgroundColor: match.lightColor + "40" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{match.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {match.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: match.color + "20",
                    color: match.color,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: match.color }}
          >
            {match.matchPercent}%
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3">{match.tagline}</p>
        <div className="flex items-center justify-end gap-2 text-sm font-medium group-hover:gap-3 transition-all" style={{ color: match.color }}>
          <span>Start sampling</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

function QuizResultsContent() {
  const searchParams = useSearchParams();
  const showAnalyzing = searchParams.get("analyzing") === "true";

  const [phase, setPhase] = useState<"analyzing" | "results">(
    showAnalyzing ? "analyzing" : "results"
  );
  const [matches, setMatches] = useState<MatchCard[] | null>(null);
  const [loading, setLoading] = useState(!showAnalyzing);

  const handleAnalyzingComplete = useCallback((newMatches: MatchCard[]) => {
    setMatches(newMatches);
    setPhase("results");
  }, []);

  useEffect(() => {
    if (phase === "results" && !showAnalyzing) {
      // Load existing matches from database
      getHobbyMatches()
        .then((result) => {
          if (result.data && result.data.length > 0) {
            setMatches(
              (result.data as unknown as HobbyMatchRow[]).map(dbMatchToCard)
            );
          } else {
            setMatches(PLACEHOLDER_MATCHES);
          }
          setLoading(false);
        })
        .catch(() => {
          setMatches(PLACEHOLDER_MATCHES);
          setLoading(false);
        });
    }
  }, [phase, showAnalyzing]);

  if (phase === "analyzing") {
    return <AnalyzingPhase onComplete={handleAnalyzingComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--lavender)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <span className="text-5xl block">&#x1F50D;</span>
          <h1 className="!text-2xl md:!text-3xl">No Matches Yet</h1>
          <p className="text-gray-500">
            Take our quiz to discover hobbies that match your personality!
          </p>
          <Link
            href="/discover/quiz"
            className="inline-block px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: "var(--lavender)" }}
          >
            Take the Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="pt-4">
            <p className="text-sm font-bold tracking-widest uppercase text-[var(--lavender)] mb-2">
              Your creative matches
            </p>
            <h1 className="!text-3xl md:!text-4xl">We Found Your Spark!</h1>
            <p className="text-gray-500 text-lg mt-3 max-w-lg mx-auto">
              Based on your answers, here are the hobbies we think you&apos;ll
              love. Tap any to start exploring!
            </p>
          </div>
        </motion.div>

        {/* Match cards */}
        <div className="space-y-5">
          {matches.map((match, index) => (
            <MatchCard key={match.slug} match={match} index={index} />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-10 space-y-3"
        >
          <p className="text-gray-400 text-sm">
            These matches are powered by your quiz answers. Pick one to try —
            you can always come back and explore the others!
          </p>
          <Link
            href="/discover"
            className="inline-block text-sm font-medium text-[var(--lavender)] hover:underline"
          >
            &larr; Back to discovery home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--lavender)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QuizResultsContent />
    </Suspense>
  );
}
