"use client";

import { useCallback, useMemo, useState } from "react";
import { getUserHobbies } from "@/app/actions/hobbies";
import { getSessions } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { getUserRoadmaps, toggleRoadmapGoal } from "@/app/actions/roadmap";
import { toActiveHobbies, toPracticeSession, toChallenge, toRoadmap } from "@/lib/transformData";
import type { ActiveHobby, Challenge, PracticeSession, Roadmap } from "@/lib/dashboardData";
import {
  buildDashboardHobbies,
  buildLiveChallenges,
  buildWeek,
  deriveStreak,
  deriveVariant,
  pickSuggestedHobbyId,
  type DashboardChallenge,
  type DashboardHobby,
  type DashboardVariant,
  type StreakState,
  type WeekDay,
} from "@/lib/dashboardHome";

export interface DashboardHomeData {
  isLoading: boolean;
  /** Which of the four home states to render — derived, never stored. */
  variant: DashboardVariant;
  hobbies: DashboardHobby[];
  week: WeekDay[];
  streak: StreakState;
  challenges: DashboardChallenge[];
  suggestedHobbyId: string | null;
  /** Raw shapes the session logger and add-hobby modal still take. */
  rawHobbies: ActiveHobby[];
  rawChallenges: Challenge[];
  fetchData: () => Promise<void>;
  /**
   * Fold a just-saved session into local state so the streak chip, today's week
   * block and the row meta update before the refetch lands.
   */
  addLoggedSession: (hobbySlug: string, imageUrl?: string | null) => void;
  /**
   * Tick/untick a roadmap checklist item. Optimistic: the box flips before the
   * write lands and reverts if it fails, because a checkbox that lags a network
   * round trip feels broken.
   */
  toggleGoal: (userRoadmapId: string, goalKey: string) => void;
}

/**
 * Single fetch for the dashboard home. Everything the page shows is derived
 * from these four collections by the pure functions in lib/dashboardHome.ts —
 * the hook holds no view state of its own.
 */
export function useDashboardHome(): DashboardHomeData {
  const [isLoading, setIsLoading] = useState(true);
  const [rawHobbies, setRawHobbies] = useState<ActiveHobby[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [rawChallenges, setRawChallenges] = useState<Challenge[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [hobbiesRes, sessionsRes, challengesRes, roadmapsRes] = await Promise.all([
        getUserHobbies(),
        getSessions(),
        getUserChallenges(),
        getUserRoadmaps(),
      ]);

      setRawHobbies(toActiveHobbies(hobbiesRes.data ?? null));
      setSessions(sessionsRes.data ? sessionsRes.data.map(toPracticeSession) : []);
      setRawChallenges(challengesRes.data ? challengesRes.data.map(toChallenge) : []);
      setRoadmaps(roadmapsRes.data ? roadmapsRes.data.map(toRoadmap) : []);
    } catch (e) {
      console.error("[DashboardHome] Failed to load dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLoggedSession = useCallback((hobbySlug: string, imageUrl?: string | null) => {
    setSessions((prev) => [
      {
        id: `pending-${Date.now()}`,
        hobbySlug,
        hobbyName: hobbySlug,
        date: new Date().toISOString(),
        duration: 0,
        mood: "okay",
        notes: "",
        challengeId: null,
        imageUrl: imageUrl ?? null,
      },
      ...prev,
    ]);
  }, []);

  /** Flip one key in a roadmap's completedGoals, locally. */
  const applyGoalToggle = useCallback((userRoadmapId: string, goalKey: string) => {
    setRoadmaps((prev) =>
      prev.map((r) => {
        if (r.userRoadmapId !== userRoadmapId) return r;
        const done = r.completedGoals.includes(goalKey);
        return {
          ...r,
          completedGoals: done
            ? r.completedGoals.filter((k) => k !== goalKey)
            : [...r.completedGoals, goalKey],
        };
      }),
    );
  }, []);

  const toggleGoal = useCallback(
    (userRoadmapId: string, goalKey: string) => {
      applyGoalToggle(userRoadmapId, goalKey);
      toggleRoadmapGoal(userRoadmapId, goalKey)
        .then((res) => {
          if (res.error) {
            console.error("[DashboardHome] Failed to toggle goal:", res.error);
            applyGoalToggle(userRoadmapId, goalKey); // put it back
          }
        })
        .catch((e) => {
          console.error("[DashboardHome] Failed to toggle goal:", e);
          applyGoalToggle(userRoadmapId, goalKey);
        });
    },
    [applyGoalToggle],
  );

  const hobbies = useMemo(
    () => buildDashboardHobbies(rawHobbies, sessions, roadmaps),
    [rawHobbies, sessions, roadmaps],
  );
  const streak = useMemo(() => deriveStreak(sessions), [sessions]);
  const week = useMemo(() => buildWeek(sessions, hobbies), [sessions, hobbies]);
  const variant = useMemo(() => deriveVariant(hobbies), [hobbies]);
  const challenges = useMemo(
    () => buildLiveChallenges(rawChallenges, hobbies),
    [rawChallenges, hobbies],
  );
  const suggestedHobbyId = useMemo(
    () => pickSuggestedHobbyId(hobbies, streak),
    [hobbies, streak],
  );

  return {
    isLoading,
    variant,
    hobbies,
    week,
    streak,
    challenges,
    suggestedHobbyId,
    rawHobbies,
    rawChallenges,
    fetchData,
    addLoggedSession,
    toggleGoal,
  };
}
