"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SessionLoggerModal,
  LogPracticeFAB,
  HobbyDangerZone,
  HobbyJourney,
  ChallengeModal,
} from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import type { Challenge } from "@/lib/dashboardData";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { createSession } from "@/app/actions/sessions";
import { triggerPracticeFeedback } from "@/app/actions/feedback";
import { checkAndAwardMilestones } from "@/app/actions/milestones";
import { useHobbyPage } from "@/lib/hooks/useHobbyPage";
import { useRoadmapGeneration } from "@/lib/hooks/useRoadmapGeneration";
import { useChallengeGeneration } from "@/lib/hooks/useChallengeGeneration";
import { useChallengeActions } from "@/lib/hooks/useChallengeActions";

export default function HobbyJourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [loggerOpen, setLoggerOpen] = useState(false);

  const page = useHobbyPage(slug);
  const challengeUi = useChallengeActions(page.fetchData);

  /* Records the intent, then opens the logger — the session is what completes
     the challenge. Skipping `beginCompletion` leaves `pendingCompletion` null,
     which silently drops both the session's `userChallengeId` and the
     completion write. */
  const logAndComplete = (challenge: Challenge) => {
    challengeUi.beginCompletion(challenge);
    setLoggerOpen(true);
  };

  /* Both generation flows share the roadmap hook's shape: the job survives
     leaving the page, so coming back mid-build shows it still running rather
     than offering to start a second one. */
  const roadmapGen = useRoadmapGeneration(page.fetchData);
  const challengeGen = useChallengeGeneration(page.fetchData);

  if (page.isLoading) return <PageSkeleton />;

  const handleSaveSession = async (data: SessionFormData) => {
    const target = page.allHobbies.find((h) => h.slug === data.hobbySlug);
    if (!target) return;

    const result = await createSession({
      userHobbyId: target.userHobbyId,
      userChallengeId: challengeUi.pendingCompletion?.id ?? null,
      sessionType: data.type,
      duration: data.duration,
      mood: data.mood,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });

    if (result.data?.id) {
      triggerPracticeFeedback(result.data.id).catch((e) =>
        console.error("[HobbyPage] Failed to trigger feedback:", e),
      );
    }

    /* The only path that completes a challenge: the session is what makes it
       true, so completion is recorded here rather than by a button. */
    challengeUi.completeAfterSession().catch((e) =>
      console.error("[Challenge] Completion failed:", e),
    );

    checkAndAwardMilestones().catch((e) =>
      console.error("[HobbyPage] Milestone check failed:", e),
    );

    page.fetchData();
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={page.allHobbies}
        activeChallenges={page.challenges}
        initialHobbySlug={slug}
      />

      <ChallengeModal
        challenge={challengeUi.open}
        onClose={challengeUi.close}
        generatingNext={challengeUi.generatingNext}
        onLogAndComplete={logAndComplete}
        onGenerateNext={challengeUi.generateNext}
        onSwap={challengeUi.swap}
        error={challengeUi.error}
      />

      <HobbyJourney
        name={page.name}
        slug={slug}
        theme={page.theme}
        hobby={page.hobby}
        sessions={page.sessions}
        challenges={page.challenges}
        roadmap={page.roadmap}
        feedbackMap={page.feedbackMap}
        backHref="/dashboard"
        sessionHref={(id) => `/dashboard/sessions/${id}`}
        watchHref={`/discover/sampling/${slug}/watch`}
        microHref={`/discover/sampling/${slug}/micro`}
        localHref={`/discover/sampling/${slug}/local`}
        generatingChallenge={challengeGen.generatingSlugs.has(slug)}
        challengeError={challengeGen.errors[slug] ?? null}
        generatingRoadmap={roadmapGen.generatingSlugs.has(slug)}
        roadmapError={roadmapGen.errors[slug] ?? null}
        onGenerateChallenge={() => challengeGen.generate(slug)}
        onGenerateRoadmap={() => roadmapGen.generate(slug)}
        onLogPractice={() => setLoggerOpen(true)}
        onAdvancePhase={page.advancePhase}
        onToggleGoal={page.toggleGoal}
        advancingPhase={page.advancing}
        advanceError={page.advanceError}
        onOpenChallenge={challengeUi.openChallenge}
        onSwapChallenge={challengeUi.swap}
        swappingChallenge={challengeUi.generatingNext}
        swapError={challengeUi.error}
        onDismissSwapError={challengeUi.clearError}
        onLogAndComplete={logAndComplete}
        dangerZone={
          page.hobby ? (
            <HobbyDangerZone
              userHobbyId={page.hobby.userHobbyId}
              name={page.name}
              defaultName={page.defaultName}
              status={page.hobby.status}
              sessionCount={page.sessions.length}
              onRenamed={page.setHobbyName}
              onStatusChanged={() => page.fetchData()}
              onDeleted={() => router.push("/dashboard")}
            />
          ) : undefined
        }
      />

      <LogPracticeFAB onClick={() => setLoggerOpen(true)} />
    </>
  );
}
