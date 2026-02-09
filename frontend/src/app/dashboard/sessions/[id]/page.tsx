"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getSessionById } from "@/app/actions/sessions";
import { toPracticeSession } from "@/lib/transformData";
import { moodEmojis } from "@/lib/dashboardData";
import type { PracticeSession } from "@/lib/dashboardData";
import {
  getSessionFeedback,
  triggerPracticeFeedback,
  pollPracticeFeedbackStatus,
  type PracticeFeedback,
} from "@/app/actions/feedback";

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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
        <Link href="/dashboard/sessions" className="text-sm text-[var(--secondary)] mt-2 inline-block">
          Back to sessions
        </Link>
      </div>
    );
  }

  const mood = moodEmojis[session.mood] ?? { emoji: "", label: "" };
  const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div variants={fadeUp} className="mb-6">
        <Link href="/dashboard/sessions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All sessions
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: session.hobbyColor + "15" }}>
        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: session.hobbyColor + "25" }}>
              {mood.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: session.hobbyColor + "25", color: session.hobbyColor }}>
                  {session.hobbyName}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{formattedDate}</p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4" /> {session.duration} minutes
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  {mood.emoji} {mood.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Session Notes</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{session.notes || "No notes for this session."}</p>
      </motion.div>

      {/* Uploaded Image */}
      {session.imageUrl && (
        <motion.div variants={fadeUp} className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.imageUrl}
            alt="Practice session"
            className="w-full rounded-2xl object-cover max-h-96"
          />
        </motion.div>
      )}

      {/* AI Feedback — uses explicit initial/animate (not parent variants)
           because feedback loads async after the parent stagger animation completes.
           Children with variants={fadeUp} would be stuck at opacity:0. */}
      {feedbackLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            <p className="text-sm text-gray-500">Generating AI feedback...</p>
          </div>
        </motion.div>
      )}

      {feedback && (
        <>
          {feedback.celebration && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: session.hobbyColor + "12" }}
            >
              <p className="text-sm font-medium" style={{ color: session.hobbyColor }}>
                {feedback.celebration}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
          >
            {feedback.observations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Observations</h2>
                <ul className="space-y-2">
                  {feedback.observations.map((o, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1 flex-shrink-0" style={{ color: session.hobbyColor }}>&#8226;</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.growth.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Growth</h2>
                <ul className="space-y-2">
                  {feedback.growth.map((g, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-400 mt-1 flex-shrink-0">&#8226;</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {feedback.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
            >
              <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Try Next</h2>
              <ul className="space-y-2">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-400 mt-1 flex-shrink-0">&#8226;</span>{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      )}

      {session.challengeId && (
        <motion.div variants={fadeUp}>
          <Link href={`/dashboard/challenges/${session.challengeId}`} className="inline-flex items-center gap-2 text-sm text-[var(--secondary)] font-medium hover:underline">
            View related challenge &rarr;
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
