"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getSessionById } from "@/app/actions/sessions";
import { toPracticeSession } from "@/lib/transformData";
import { moodEmojis } from "@/lib/dashboardData";
import type { PracticeSession } from "@/lib/dashboardData";

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
