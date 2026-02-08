"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { SessionDetail, ChallengeModal } from "@/components/dashboard";
import { getSessionById } from "@/app/actions/sessions";
import { toPracticeSession, toChallenge } from "@/lib/transformData";
import { getChallengeById } from "@/app/actions/challenges";
import { useChallengeActions } from "@/lib/hooks/useChallengeActions";
import type { Challenge } from "@/lib/dashboardData";
import type { PracticeSession } from "@/lib/dashboardData";
import {
  getSessionFeedback,
  triggerPracticeFeedback,
  pollPracticeFeedbackStatus,
  type PracticeFeedback,
} from "@/app/actions/feedback";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const challengeUi = useChallengeActions(() => {});

  // Fetched lazily: only sessions logged against a challenge have one.
  useEffect(() => {
    if (!session?.challengeId) return;
    let cancelled = false;
    getChallengeById(session.challengeId)
      .then((res) => { if (!cancelled && res.data) setChallenge(toChallenge(res.data)); })
      .catch((e) => console.error("[Session] Failed to load challenge:", e));
    return () => { cancelled = true; };
  }, [session?.challengeId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSessionById(id);
        if (res.data) setSession(toPracticeSession(res.data));
        else setError(true);
      } catch { setError(true); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  // Fetch or trigger AI feedback
  useEffect(() => {
    if (!session || session.mood === undefined) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      // Check if feedback already exists
      const existing = await getSessionFeedback(id);
      if (cancelled) return;
      if (existing.data) {
        setFeedback(existing.data);
        return;
      }

      // Auto-trigger feedback for practice sessions
      setFeedbackLoading(true);
      const { job_id, error: triggerErr } = await triggerPracticeFeedback(id);
      if (cancelled) return;
      if (triggerErr || !job_id) {
        setFeedbackLoading(false);
        return;
      }

      // Poll
      pollTimer = setInterval(async () => {
        const status = await pollPracticeFeedbackStatus(job_id);
        if (cancelled) return;
        if ("status" in status) {
          if (status.status === "completed" && status.result) {
            if (pollTimer) clearInterval(pollTimer);
            setFeedback(status.result);
            setFeedbackLoading(false);
          } else if (status.status === "failed") {
            if (pollTimer) clearInterval(pollTimer);
            setFeedbackLoading(false);
          }
        }
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [id, session]);

  if (isLoading) return <PageSkeleton />;

  if (error || !session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Session not found.</p>
        <Link href="/dashboard" className="text-sm text-[var(--secondary)] mt-2 inline-block">
          Back to hobbies
        </Link>
      </div>
    );
  }

  return (
    <>
      <ChallengeModal
        challenge={challengeUi.open}
        onClose={challengeUi.close}
        generatingNext={challengeUi.generatingNext}
        onLogAndComplete={challengeUi.close}
        onGenerateNext={challengeUi.generateNext}
        onSwap={challengeUi.swap}
        error={challengeUi.error}
      />
      <SessionDetail
        session={session}
        feedback={feedback}
        feedbackLoading={feedbackLoading}
        /* The sessions index is gone; a session belongs to its hobby, and the
           hobby page is the list it came from. */
        backHref={`/dashboard/hobby/${session.hobbySlug}`}
        backLabel={session.hobbyName}
        onOpenChallenge={challenge ? () => challengeUi.openChallenge(challenge) : undefined}
      />
    </>
  );
}
