"use client";

import { useState, useEffect, useMemo } from "react";
import { SessionLoggerModal, AddHobbyModal, DashboardHome, ChallengeModal } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useDashboardHome } from "@/lib/hooks/useDashboardHome";
import { useRoadmapGeneration } from "@/lib/hooks/useRoadmapGeneration";
import { deriveNudge } from "@/lib/nudge";
import { useChallengeActions } from "@/lib/hooks/useChallengeActions";
import { updateHobbyStatus } from "@/app/actions/hobbies";
import { createSession } from "@/app/actions/sessions";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { checkAndAwardMilestones } from "@/app/actions/milestones";

export default function DashboardPage() {
  const { profile, user } = useUser();
  const {
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
  } = useDashboardHome();

  const {
    generate: generateRoadmap,
    generatingSlugs,
    errors: roadmapErrors,
  } = useRoadmapGeneration(fetchData);

  /* Derived, not fetched — see lib/nudge.ts. Nothing to poll, nothing to rate
     limit, and it lands with the first paint rather than a few seconds after. */
  const nudge = useMemo(
    () =>
      isLoading
        ? null
        : deriveNudge({ variant, streak, hobbies, hasLiveChallenge: challenges.length > 0 }),
    [isLoading, variant, streak, hobbies, challenges],
  );

  const challengeUi = useChallengeActions(fetchData);
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [loggerInitialSlug, setLoggerInitialSlug] = useState<string | undefined>();
  const [loggerInitialDuration, setLoggerInitialDuration] = useState<number | undefined>();
  const [addHobbyOpen, setAddHobbyOpen] = useState(false);
  const [resumingHobbyId, setResumingHobbyId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const firstName =
    (profile?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  /* One opener. The focus timer passes both, so a finished session arrives at
     the modal with nothing left to fill in. */
  const openLogger = (slug?: string, duration?: number) => {
    setLoggerInitialSlug(slug);
    setLoggerInitialDuration(duration);
    setLoggerOpen(true);
  };

  const handleSaveSession = async (data: SessionFormData) => {
    const hobby = rawHobbies.find((h) => h.slug === data.hobbySlug);
    if (!hobby) return;

    const result = await createSession({
      userHobbyId: hobby.userHobbyId,
      userChallengeId: challengeUi.pendingCompletion?.id ?? null,
      sessionType: data.type,
      duration: data.duration,
      mood: data.mood,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });

    if (result.error) {
      console.error("[Dashboard] Failed to save session:", result.error);
      return;
    }

    // Flip the streak chip, fill today's block and drop the row to `outline`
    // straight away; the refetch below just reconciles.
    addLoggedSession(data.hobbySlug, data.imageUrl ?? null);

    if (result.data?.id) {
      triggerPracticeFeedback(result.data.id).catch((e) =>
        console.error("[Dashboard] Failed to trigger feedback:", e),
      );
    }
    /* The only path that completes a challenge: the session is what makes
       it true, so completion is recorded here rather than by a button. */
    challengeUi.completeAfterSession().catch((e) =>
      console.error("[Challenge] Completion failed:", e),
    );

    checkAndAwardMilestones().catch((e) =>
      console.error("[Dashboard] Milestone check failed:", e),
    );

    fetchData().catch((e) => console.error("[Dashboard] Refetch failed:", e));
  };

  const handleResume = async (userHobbyId: string) => {
    if (resumingHobbyId) return;
    setResumingHobbyId(userHobbyId);
    const res = await updateHobbyStatus(userHobbyId, "active");
    if (res.error) console.error("[Dashboard] Failed to resume hobby:", res.error);
    await fetchData();
    setResumingHobbyId(null);
  };

  /* No FAB here. Every visible card carries a "Log session" that arrives at the
     modal with the hobby already chosen, and the header button covers the case
     where none of them is the one you mean — so the floating button would be a
     third entry point offering the slowest path. It stays on the hobby and
     progress pages, where no such card is in reach. */

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={rawHobbies}
        activeChallenges={rawChallenges}
        initialHobbySlug={loggerInitialSlug}
        initialDuration={loggerInitialDuration}
      />
      <ChallengeModal
        challenge={challengeUi.open}
        onClose={challengeUi.close}
        generatingNext={challengeUi.generatingNext}
        onLogAndComplete={(c) => { challengeUi.beginCompletion(c); openLogger(c.hobbySlug); }}
        onGenerateNext={challengeUi.generateNext}
        onSwap={challengeUi.swap}
        error={challengeUi.error}
      />
      <AddHobbyModal
        isOpen={addHobbyOpen}
        onClose={() => setAddHobbyOpen(false)}
        onAdded={fetchData}
      />

      <DashboardHome
        variant={variant}
        firstName={firstName}
        streak={streak}
        hobbies={hobbies}
        week={week}
        challenges={challenges}
        suggestedHobbyId={suggestedHobbyId}
        resumingHobbyId={resumingHobbyId}
        generatingSlugs={generatingSlugs}
        roadmapErrors={roadmapErrors}
        onLog={openLogger}
        onAddHobby={() => setAddHobbyOpen(true)}
        onResume={handleResume}
        onGenerateRoadmap={generateRoadmap}
        onToggleGoal={toggleGoal}
        onTimerComplete={(slug, minutes) => openLogger(slug, minutes)}
        onOpenChallenge={(id) => {
          const c = rawChallenges.find((x) => x.id === id);
          if (c) challengeUi.openChallenge(c);
        }}
        nudge={nudge && { message: nudge.message }}
      />
    </>
  );
}
