"use client";

import { useState, useEffect } from "react";
import { getHobbyMatches } from "@/app/actions/quiz";
import {
  pollDiscoveryStatus,
  DiscoveryStatusResponse,
} from "@/app/actions/discovery";
import { hobbyMeta } from "@/lib/hobbyData";
import type { MatchCard, HobbyMatchRow } from "@/lib/types/quiz";

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

export function useQuizMatches() {
  const [matches, setMatches] = useState<MatchCard[] | null>(() => {
    if (matchesCache.data !== null) return matchesCache.data;
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("quiz-matches");
      if (stored) {
        const cards: MatchCard[] = JSON.parse(stored);
        if (cards.length > 0) {
          matchesCache.data = cards;
          return cards;
        }
      }
    } catch (e) { console.warn("[Results] sessionStorage parse error:", e); }
    return null;
  });

  const [loading, setLoading] = useState(matchesCache.data === null);

  useEffect(() => {
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

  return { matches, loading };
}
