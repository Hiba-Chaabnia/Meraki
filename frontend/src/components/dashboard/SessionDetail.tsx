"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { moodEmojis } from "@/lib/dashboardData";
import type { PracticeSession } from "@/lib/dashboardData";
import type { PracticeFeedback } from "@/app/actions/feedback";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeftIcon, ClockIcon } from "@/components/ui/Icons";

const stagger = staggerContainer(0.08);

export interface SessionDetailProps {
  session: PracticeSession;
  feedback: PracticeFeedback | null;
  feedbackLoading?: boolean;
  backHref: string;
  /** Label for the back link. Defaults to the hobby-agnostic wording. */
  backLabel?: string;
  /** Opens the related challenge. Omitted hides the link. */
  onOpenChallenge?: () => void;
  /** Trailing slot in the back-link row — the preview puts its state switcher here. */
  headerAction?: ReactNode;
}

export function SessionDetail({
  session,
  feedback,
  feedbackLoading = false,
  backHref,
  backLabel = "All sessions",
  onOpenChallenge,
  headerAction,
}: SessionDetailProps) {
  const mood = moodEmojis[session.mood] ?? { emoji: "", label: "" };
  const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div variants={fadeUp} className="mb-6 flex items-center justify-between">
        <Link href={backHref} className="back-link">
          <ArrowLeftIcon className="w-4 h-4" /> {backLabel}
        </Link>
        {headerAction}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden mb-6 bg-gray-100">
        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gray-200">
              {mood.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">
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
        <h2 className="card-heading mb-3">Session Notes</h2>
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
            <Spinner size="sm" variant="subtle" />
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
              className="rounded-2xl p-5 mb-6 bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-700">
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
                <h2 className="card-heading mb-3">Observations</h2>
                <ul className="space-y-2">
                  {feedback.observations.map((o, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1 flex-shrink-0 text-gray-700">&#8226;</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.growth.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="card-heading mb-3">Growth</h2>
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
              <h2 className="card-heading mb-3">Try Next</h2>
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

      {onOpenChallenge && (
        <motion.div variants={fadeUp}>
          <button
            onClick={onOpenChallenge}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--secondary)] hover:underline"
          >
            View related challenge &rarr;
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
