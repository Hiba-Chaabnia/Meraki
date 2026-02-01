"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  SessionLoggerModal,
  AddHobbyModal,
  TodaysFocus,
  LogPracticeFAB,
} from "@/components/dashboard";
import { HobbiesSection } from "@/components/dashboard/HobbiesSection";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { useUser } from "@/lib/hooks/useUser";
import { getUserHobbies } from "@/app/actions/hobbies";
import { createSession } from "@/app/actions/sessions";
import { getUserChallenges } from "@/app/actions/challenges";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { getActiveNudge, type NudgeData } from "@/app/actions/nudges";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import { toActiveHobbies, toChallenge } from "@/lib/transformData";
import { getGreeting } from "@/lib/dashboardData";
import type { ActiveHobby, Challenge } from "@/lib/dashboardData";

export default function DashboardPage() {
  const { profile } = useUser();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [loggerInitialSlug, setLoggerInitialSlug] = useState<string | undefined>();
  const [addHobbyOpen, setAddHobbyOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [nudge, setNudge] = useState<NudgeData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [hobbiesRes, challengesRes, nudgeRes] = await Promise.all([
        getUserHobbies(),
        getUserChallenges(),
        getActiveNudge(),
      ]);

      const activeHobbies = toActiveHobbies(hobbiesRes.data ?? null);
      setHobbies(activeHobbies);

      if (challengesRes.data) setChallenges(challengesRes.data.map(toChallenge));
      if (nudgeRes.data) setNudge(nudgeRes.data);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const displayName = profile?.full_name || "Creative";
  const activeChallenges = challenges.filter((c) => c.status === "active" || c.status === "upcoming");

  const openLogger = (slug?: string) => {
    setLoggerInitialSlug(slug);
    setLoggerOpen(true);
  };

  const handleSaveSession = async (data: SessionFormData) => {
    const hobby = hobbies.find((h) => h.slug === data.hobbySlug);
    if (!hobby) return;
    const result = await createSession({
      userHobbyId: hobby.userHobbyId,
      sessionType: data.type,
      duration: data.duration,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });
    if (result.data?.id) {
      triggerPracticeFeedback(result.data.id).catch((e) =>
        console.error("[Dashboard] Failed to trigger feedback:", e)
      );
    }
    checkAndAwardMilestones().catch((e) =>
      console.error("[Dashboard] Milestone check failed:", e)
    );
    fetchData();
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={hobbies}
        activeChallenges={challenges}
        initialHobbySlug={loggerInitialSlug}
      />
      <AddHobbyModal
        isOpen={addHobbyOpen}
        onClose={() => setAddHobbyOpen(false)}
        onAdded={fetchData}
      />

      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pb-12 space-y-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6"
          >
            <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 leading-tight">
              {getGreeting(displayName)}
            </h1>
          </motion.div>

          {/* Today's Focus — only renders when there's something actionable */}
          <TodaysFocus
            hobbies={hobbies}
            activeChallenges={activeChallenges}
            nudge={nudge}
            onDismissNudge={() => setNudge(null)}
          />

          {/* My Hobbies */}
          <HobbiesSection
            hobbies={hobbies}
            challenges={challenges}
            onAddHobby={() => setAddHobbyOpen(true)}
            onStatusChange={fetchData}
            onLogHobby={(slug) => openLogger(slug)}
          />

        </div>
      </div>

      {/* Floating log button */}
      <LogPracticeFAB onClick={() => openLogger()} />
    </>
  );
}
