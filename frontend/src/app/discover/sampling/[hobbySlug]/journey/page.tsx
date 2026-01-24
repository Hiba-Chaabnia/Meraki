"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getHobby, getJourneyData } from "@/lib/hobbyData";
import type { JourneyDay } from "@/lib/hobbyData";

function loadJourneyState(hobbySlug: string): { started: boolean; completedDays: Set<number> } {
  try {
    const raw = localStorage.getItem(`meraki-journey-${hobbySlug}`);
    if (raw) {
      const data = JSON.parse(raw);
      return { started: data.started ?? false, completedDays: new Set(data.completedDays ?? []) };
    }
  } catch {}
  return { started: false, completedDays: new Set() };
}

function saveJourneyState(hobbySlug: string, started: boolean, completedDays: Set<number>) {
  try {
    localStorage.setItem(`meraki-journey-${hobbySlug}`, JSON.stringify({ started, completedDays: [...completedDays] }));
  } catch {}
}

/* ─── Icons ─── */
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
  </svg>
);
const RocketIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Video: { bg: "#AFDDFF", text: "#2B7FBF" },
  Read: { bg: "#feeda8", text: "#B8860B" },
  Exercise: { bg: "#D4EFCF", text: "#3D8B3D" },
  Reflection: { bg: "#E8E2F7", text: "#7B68AE" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════
   Journey page — "7-Day Path"
   ═══════════════════════════════════════════════════════ */
export default function JourneyPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const days = getJourneyData(hobbySlug);

  const initialized = useRef(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [started, setStarted] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadJourneyState(hobbySlug);
    if (saved.started) {
      setStarted(true);
      setShowStartModal(false);
      setCompletedDays(saved.completedDays);
    }
  }, [hobbySlug]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setShowStartModal(false);
    saveJourneyState(hobbySlug, true, new Set());
  }, [hobbySlug]);

  const toggleDay = useCallback((day: number) => {
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      saveJourneyState(hobbySlug, true, next);
      return next;
    });
  }, [hobbySlug]);

  function isDayUnlocked(day: number) {
    if (day === 1) return started;
    return completedDays.has(day - 1);
  }

  const progressPercent = (completedDays.size / days.length) * 100;
  const allDone = completedDays.size === days.length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Start modal ── */}
      <AnimatePresence>
        {showStartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => {
                if (started) setShowStartModal(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full z-10"
            >
              {started && (
                <button
                  onClick={() => setShowStartModal(false)}
                  className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}

              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: "#E8E2F7" }}
                >
                  <RocketIcon className="w-8 h-8 text-[var(--lavender)]" />
                </div>
                <h2 className="!text-xl md:!text-2xl mb-2">
                  Ready to Start Your 7-Day Journey?
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {hobby.name} in 7 days &mdash; just 15&ndash;30 minutes a
                  day. No pressure, no deadlines. Go at your pace!
                </p>

                <button
                  onClick={handleStart}
                  className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: "var(--lavender)" }}
                >
                  Start Today!
                </button>

                <p className="text-xs text-gray-300 mt-4">
                  You can pause anytime and pick up where you left off.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-2">
        <Link
          href={`/discover/sampling/${hobbySlug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sampling
        </Link>
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 pt-4 pb-2"
      >
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--lavender)] mb-1">
          {hobby.name} &middot; 7-Day Path
        </p>
        <h1 className="!text-2xl md:!text-3xl mb-4">
          Your Creative Journey
        </h1>
      </motion.div>

      {/* ── Progress bar ── */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{completedDays.size} of {days.length} days complete</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--lavender)" }}
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Day timeline ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gray-100" />

          <div className="space-y-4">
            {days.map((day) => {
              const unlocked = isDayUnlocked(day.day);
              const done = completedDays.has(day.day);
              return (
                <DayCard
                  key={day.day}
                  day={day}
                  unlocked={unlocked}
                  done={done}
                  hobbyColor={hobby.color}
                  onToggle={() => toggleDay(day.day)}
                />
              );
            })}
          </div>
        </div>

        {/* ── All-done celebration ── */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12 text-center"
            >
              <div
                className="rounded-3xl px-8 py-12 md:px-12"
                style={{ backgroundColor: "#E8E2F7" }}
              >
                <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-[var(--lavender)]" />
                <h2 className="!text-2xl md:!text-3xl mb-3">
                  Journey Complete!
                </h2>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  You spent 7 days exploring {hobby.name} &mdash; that takes
                  real dedication! Whether you loved it or learned it&apos;s not
                  for you, you should be proud.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`/discover/sampling/${hobbySlug}/complete`}
                    className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95 bg-[var(--lavender)]"
                  >
                    Complete &amp; Add to Dashboard &rarr;
                  </Link>
                  <Link
                    href="/discover/quiz/results"
                    className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Try a different hobby
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Day card ─── */
function DayCard({
  day,
  unlocked,
  done,
  hobbyColor,
  onToggle,
}: {
  day: JourneyDay;
  unlocked: boolean;
  done: boolean;
  hobbyColor: string;
  onToggle: () => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`relative pl-14 ${!unlocked ? "opacity-50" : ""}`}
    >
      {/* Timeline node */}
      <div className="absolute left-0 top-6">
        {done ? (
          <div className="w-[45px] h-[45px] rounded-full bg-[var(--green)] flex items-center justify-center shadow-sm">
            <CheckIcon className="w-5 h-5 text-white" />
          </div>
        ) : unlocked ? (
          <div
            className="w-[45px] h-[45px] rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--lavender)" }}
          >
            <span className="text-white font-bold text-sm">{day.day}</span>
          </div>
        ) : (
          <div className="w-[45px] h-[45px] rounded-full bg-gray-100 flex items-center justify-center">
            <LockIcon className="w-4 h-4 text-gray-300" />
          </div>
        )}
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-2xl border shadow-sm p-6 transition-colors ${
          done ? "border-green-200" : unlocked ? "border-gray-100 hover:shadow-md" : "border-gray-50"
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-1">
              Day {day.day}
            </p>
            <h3 className="!text-base !font-semibold !tracking-normal !text-gray-800">
              {day.title}
            </h3>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 mt-1">
            <ClockIcon className="w-3 h-3" /> {day.duration}
          </span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {day.description}
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {day.contentTags.map((tag) => {
              const colors = TAG_COLORS[tag] ?? { bg: "#f3f4f6", text: "#6b7280" };
              return (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Action */}
          {unlocked && !done && (
            <button
              onClick={onToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: hobbyColor }}
            >
              <PlayIcon className="w-3.5 h-3.5" />
              Start Day
            </button>
          )}
          {done && (
            <button
              onClick={onToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              Completed
            </button>
          )}
          {!unlocked && (
            <span className="text-xs text-gray-300 flex items-center gap-1">
              <LockIcon className="w-3 h-3" /> Complete Day {day.day - 1} first
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
