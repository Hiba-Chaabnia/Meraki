"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getHobbyMatches } from "@/app/actions/quiz";
import {
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

/* ─── Module-level cache ───
   Survives component unmount/remount during client-side navigation.
   Primary guard against showing "No Matches Yet" on back-nav. */
const matchesCache: { data: MatchCard[] | null } = { data: null };

function cacheMatches(cards: MatchCard[]) {
  matchesCache.data = cards;
  try {
    sessionStorage.setItem("quiz-matches", JSON.stringify(cards));
  } catch { /* quota exceeded — module cache is primary */ }
}

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

function MatchCardComponent({ match, index }: { match: MatchCard; index: number }) {
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

export default function QuizResultsPage() {
  // Sync check: module cache -> sessionStorage
  const [matches, setMatches] = useState<MatchCard[] | null>(() => {
    if (matchesCache.data !== null) return matchesCache.data;
    if (typeof window === "undefined") return null; // SSR — skip sessionStorage
    try {
      const stored = sessionStorage.getItem("quiz-matches");
      if (stored) {
        const cards: MatchCard[] = JSON.parse(stored);
        if (cards.length > 0) {
          matchesCache.data = cards; // backfill module cache
          return cards;
        }
      }
    } catch (e) { console.warn("[Results] sessionStorage parse error:", e); }
    return null;
  });

  const [loading, setLoading] = useState(matchesCache.data === null);

  // Async fallback: hydrate from sessionStorage on client, then fall back to DB
  useEffect(() => {
    // On client mount, try sessionStorage first (SSR couldn't access it)
    if (matchesCache.data === null) {
      try {
        const stored = sessionStorage.getItem("quiz-matches");
        if (stored) {
          const cards: MatchCard[] = JSON.parse(stored);
          if (cards.length > 0) {
            matchesCache.data = cards;
            setMatches(cards);
            setLoading(false);
            return;
          }
        }
      } catch { /* sessionStorage unavailable */ }
    }

    if (matchesCache.data !== null) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAsync() {
      // 1. Check for a completed discovery job
      try {
        const storedJobId = sessionStorage.getItem("discovery-job-id");
        if (storedJobId) {
          const pollResult = await pollDiscoveryStatus(storedJobId);
          if (cancelled) return;
          if ("status" in pollResult) {
            const response = pollResult as DiscoveryStatusResponse;
            if (response.status === "completed" && response.result?.matches && response.result.matches.length > 0) {
              const cards = response.result.matches.map((m) => {
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
              cacheMatches(cards);
              if (!cancelled) { setMatches(cards); setLoading(false); }
              return;
            }
          }
        }
      } catch (e) { console.warn("[Results] Job poll failed:", e); }

      if (cancelled) return;

      // 2. Last resort: database
      try {
        const result = await getHobbyMatches();
        if (cancelled) return;
        if (result.data && result.data.length > 0) {
          const cards = (result.data as unknown as HobbyMatchRow[]).map(dbMatchToCard);
          cacheMatches(cards);
          setMatches(cards);
        } else {
          console.warn("[Results] DB returned no matches. error:", result.error);
          setMatches([]);
        }
      } catch (e) {
        console.error("[Results] Failed to load matches from DB:", e);
        setMatches([]);
      }
      if (!cancelled) setLoading(false);
    }

    loadAsync();
    return () => { cancelled = true; };
  }, []);

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
            <MatchCardComponent key={match.slug} match={match} index={index} />
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
