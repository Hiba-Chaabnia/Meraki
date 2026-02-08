"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessionsForHobby } from "@/app/actions/sessions";
import { getChallengesForHobby } from "@/app/actions/challenges";
import {
  getUserRoadmap,
  advanceRoadmapPhase,
  toggleRoadmapGoal,
} from "@/app/actions/roadmap";
import { getSessionFeedback, type PracticeFeedback } from "@/app/actions/feedback";
import {
  toActiveHobbies,
  toPracticeSession,
  toChallenge,
  toRoadmap,
} from "@/lib/transformData";
import { formatSlug } from "@/lib/hobbyData";
import { themeForActiveHobbies, type HobbyTheme } from "@/lib/dashboardHome";
import type { ActiveHobby, PracticeSession, Challenge, Roadmap } from "@/lib/dashboardData";

/** Feedback is fetched for the newest few only — it is one request each. */
const FEEDBACK_PREVIEW_COUNT = 3;

export interface HobbyPageData {
  isLoading: boolean;
  /** The renamed name where there is one, else derived from the slug. */
  name: string;
  defaultName: string;
  theme: HobbyTheme;
  hobby: ActiveHobby | null;
  /** Every hobby — the session logger offers all of them. */
  allHobbies: ActiveHobby[];
  sessions: PracticeSession[];
  challenges: Challenge[];
  roadmap: Roadmap | null;
  feedbackMap: Record<string, PracticeFeedback>;

  advancing: boolean;
  advanceError: string | null;
  advancePhase: () => Promise<void>;
  toggleGoal: (userRoadmapId: string, goalKey: string) => void;

  fetchData: () => Promise<void>;
  setHobbyName: (name: string) => void;
}

/**
 * Everything one hobby page needs, in one place.
 *
 * The page was 278 lines of orchestration — seven `useState`s, a poll in a ref,
 * three hooks and three modals — while the dashboard next door delegated to
 * `useDashboardHome`. This is the matching half.
 *
 * The reads are per-hobby now. They were `getSessions()` and
 * `getUserChallenges()`, both account-wide, filtered down client-side: a user
 * with three hobbies paid for three times what the page rendered.
 *
 * `getUserHobbies()` stays account-wide because two things need it — the
 * session logger lists every hobby, and the theme is this hobby's *position*
 * among them. That position no longer costs a session fetch: `ActiveHobby` now
 * carries real practice totals, so `themeForActiveHobbies` can order the rows
 * on their own.
 */
export function useHobbyPage(slug: string): HobbyPageData {
  const [hobby, setHobby] = useState<ActiveHobby | null>(null);
  const [allHobbies, setAllHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, PracticeFeedback>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [hobbiesRes, sessionsRes, challengesRes, roadmapRes] = await Promise.all([
        getUserHobbies(),
        getSessionsForHobby(slug),
        getChallengesForHobby(slug),
        getUserRoadmap(slug),
      ]);

      const active = toActiveHobbies(hobbiesRes.data ?? null);
      setAllHobbies(active);
      const matched = active.find((h) => h.slug === slug);
      if (matched) setHobby(matched);

      const hobbySessions = (sessionsRes.data ?? []).map(toPracticeSession);
      setSessions(hobbySessions);

      setChallenges((challengesRes.data ?? []).map(toChallenge));
      setRoadmap(roadmapRes.data ? toRoadmap(roadmapRes.data) : null);

      const recent = hobbySessions.slice(0, FEEDBACK_PREVIEW_COUNT);
      const responses = await Promise.all(recent.map((s) => getSessionFeedback(s.id)));
      const feedback: Record<string, PracticeFeedback> = {};
      responses.forEach((res, i) => {
        if (res.data) feedback[recent[i].id] = res.data;
      });
      setFeedbackMap(feedback);
    } catch (e) {
      console.error("[HobbyPage] Failed to load:", e);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const advancePhase = useCallback(async () => {
    if (!roadmap || advancing) return;
    setAdvancing(true);
    const res = await advanceRoadmapPhase(roadmap.userRoadmapId);
    if (res.error) {
      /* Was swallowed on the deleted roadmap page: "Already at final phase" or
         a refused write just closed the confirm and left the phase alone. */
      console.error("[Roadmap] Failed to advance:", res.error);
      setAdvanceError(res.error);
      fetchData();
    } else {
      setAdvanceError(null);
      setRoadmap((r) => (r ? { ...r, currentPhase: r.currentPhase + 1 } : r));
    }
    setAdvancing(false);
  }, [roadmap, advancing, fetchData]);

  /* Optimistic, then reconciled — the same shape as useDashboardHome's toggle,
     so a tick here and a tick on the dashboard card behave identically. */
  const toggleGoal = useCallback(
    (userRoadmapId: string, goalKey: string) => {
      setRoadmap((r) => {
        if (!r) return r;
        const done = r.completedGoals.includes(goalKey);
        return {
          ...r,
          completedGoals: done
            ? r.completedGoals.filter((k) => k !== goalKey)
            : [...r.completedGoals, goalKey],
        };
      });
      toggleRoadmapGoal(userRoadmapId, goalKey)
        .then((res) => {
          if (res.error) {
            console.error("[Roadmap] Failed to toggle goal:", res.error);
            fetchData();
          }
        })
        .catch((e) => {
          console.error("[Roadmap] Failed to toggle goal:", e);
          fetchData();
        });
    },
    [fetchData],
  );

  /* Local echo of a rename, so the header updates before the refetch lands. */
  const setHobbyName = useCallback((name: string) => {
    setHobby((h) => (h ? { ...h, name } : h));
  }, []);

  /* 005 lets a hobby be renamed, and the override lives on the row rather than
     in the slug — so the slug-derived name is the fallback, not the source. */
  const defaultName = useMemo(() => formatSlug(slug), [slug]);
  const theme = useMemo(() => themeForActiveHobbies(allHobbies, slug), [allHobbies, slug]);

  return {
    isLoading,
    name: hobby?.name ?? defaultName,
    defaultName,
    theme,
    hobby,
    allHobbies,
    sessions,
    challenges,
    roadmap,
    feedbackMap,
    advancing,
    advanceError,
    advancePhase,
    toggleGoal,
    fetchData,
    setHobbyName,
  };
}
