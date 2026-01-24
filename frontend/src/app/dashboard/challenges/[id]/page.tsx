"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SessionLoggerModal } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getChallengeById, completeChallenge, triggerChallengeGeneration, pollChallengeGenStatus } from "@/app/actions/challenges";
import { getUserHobbies } from "@/app/actions/hobbies";
import { createSession } from "@/app/actions/sessions";
import { toChallenge, toActiveHobby } from "@/lib/transformData";
import { difficultyConfig } from "@/lib/dashboardData";
import type { Challenge, ActiveHobby } from "@/lib/dashboardData";
import { checkAndAwardMilestones } from "@/app/actions/milestones";

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
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
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

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generatingNext, setGeneratingNext] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [challengeRes, hobbiesRes] = await Promise.all([getChallengeById(id), getUserHobbies()]);
      if (challengeRes.data) {
        const ch = toChallenge(challengeRes.data);
        setChallenge(ch);
        setIsCompleted(ch.status === "completed");
      } else { setError(true); }
      if (hobbiesRes.data) setHobbies(hobbiesRes.data.filter((h: any) => h.status === "active" || h.status === "paused").map(toActiveHobby));
    } catch { setError(true); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  if (error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Challenge not found.</p>
        <Link href="/dashboard/challenges" className="text-sm text-[var(--secondary)] mt-2 inline-block">Back to challenges</Link>
      </div>
    );
  }

  const diff = difficultyConfig[challenge.difficulty];

  const handleMarkDone = async () => {
    await completeChallenge(id);
    setIsCompleted(true);
    checkAndAwardMilestones().catch((e) => console.error("[Challenge] Milestone check failed:", e));
  };

  const handleLogAndComplete = async (data: SessionFormData) => {
    const hobbiesRes = await getUserHobbies();
    const userHobby = hobbiesRes.data?.find((uh: any) => uh.hobbies?.slug === data.hobbySlug);
    if (userHobby) {
      await createSession({
        userHobbyId: userHobby.id,
        userChallengeId: id,
        sessionType: data.type,
        duration: data.duration,
        notes: data.notes,
      });
    }
    await completeChallenge(id);
    setIsCompleted(true);
    checkAndAwardMilestones().catch((e) => console.error("[Challenge] Milestone check failed:", e));
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleLogAndComplete}
        hobbies={hobbies}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <motion.div variants={fadeUp} className="mb-6">
          <Link href="/dashboard/challenges" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All challenges
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: challenge.hobbyColor + "15" }}>
          <div className="px-6 py-8 md:px-8 md:py-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: challenge.hobbyColor + "25", color: challenge.hobbyColor }}>
                {challenge.hobbyName}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i < diff.dots ? diff.color : "#e5e7eb" }} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{diff.label}</span>
              </div>
            </div>
            <h1 className="!text-2xl md:!text-3xl mb-2">{challenge.title}</h1>
            <p className="text-gray-600">{challenge.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" /> {challenge.estimatedTime}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircleIcon className="w-4 h-4" /> Completed
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-2">Why This Challenge?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{challenge.whyThisChallenge}</p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {challenge.skills.map((skill) => (
                <span key={skill} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: challenge.hobbyColor + "15", color: challenge.hobbyColor }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">What You&apos;ll Learn</h2>
            <ul className="space-y-2">
              {challenge.whatYoullLearn.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-400 mt-1 flex-shrink-0">&#8226;</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-3">Tips</h2>
          <ul className="space-y-3">
            {challenge.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ backgroundColor: challenge.hobbyColor }}>
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>

        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div key="completed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center rounded-2xl p-8" style={{ backgroundColor: challenge.hobbyColor + "12" }}>
              <SparklesIcon className="w-10 h-10 mx-auto mb-3" style={{ color: challenge.hobbyColor }} />
              <h2 className="!text-xl md:!text-2xl mb-2">Challenge Complete!</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">Great work on finishing this challenge. Your growth is showing!</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    if (generatingNext) return;
                    setGeneratingNext(true);
                    const { job_id } = await triggerChallengeGeneration(challenge.hobbySlug);
                    if (!job_id) { setGeneratingNext(false); return; }
                    const poll = setInterval(async () => {
                      const s = await pollChallengeGenStatus(job_id);
                      if (s.status === "completed" || s.status === "failed") {
                        clearInterval(poll);
                        setGeneratingNext(false);
                      }
                    }, 2500);
                  }}
                  disabled={generatingNext}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: challenge.hobbyColor }}
                >
                  {generatingNext ? "Generating..." : "Generate Next Challenge"}
                </button>
                <Link href="/dashboard/challenges" className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                  See All Challenges
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setLoggerOpen(true)}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: challenge.hobbyColor }}
              >
                Log &amp; Complete This Challenge
              </button>
              <button
                onClick={handleMarkDone}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Mark as Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
