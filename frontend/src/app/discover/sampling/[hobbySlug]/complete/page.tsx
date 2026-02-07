"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getHobby } from "@/lib/hobbyData";
import { completeSampling } from "@/app/actions/sampling";

/* ─── Icons ─── */
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
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" />
  </svg>
);
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    emoji: "\u{1F4DD}",
    title: "Log Your Sessions",
    description: "Track every practice, capture your mood, and see how far you\u2019ve come.",
  },
  {
    emoji: "\u{1F3AF}",
    title: "Personalized Challenges",
    description: "We\u2019ll create challenges tailored to your skill level and interests.",
  },
  {
    emoji: "\u{1F4AC}",
    title: "AI Feedback",
    description: "Get thoughtful observations on your progress and suggestions for growth.",
  },
  {
    emoji: "\u{1F525}",
    title: "Streak & Milestones",
    description: "Build a practice streak and unlock milestones as you grow.",
  },
];

export default function SamplingCompletePage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    completeSampling(hobbySlug).catch((e) =>
      console.error("Failed to complete sampling:", e)
    );
  }, [hobbySlug]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-xl w-full text-center"
      >
        {/* Celebration icon */}
        <motion.div variants={fadeUp} className="mb-6">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: hobby.lightColor }}
          >
            <SparklesIcon className="w-10 h-10" style={{ color: hobby.color }} />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp}>
          <p
            className="text-sm font-bold tracking-widest uppercase mb-2"
            style={{ color: hobby.color }}
          >
            You did it!
          </p>
          <h1 className="!text-3xl md:!text-4xl mb-3">
            You&apos;ve Sampled {hobby.name}!
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            That was just the beginning. Ready to keep going and track your creative journey?
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={fadeUp}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <span className="text-2xl mb-2 block">{feature.emoji}</span>
              <h3 className="!text-sm !font-semibold !tracking-normal !text-gray-800 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-10 space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: hobby.color }}
          >
            <RocketIcon className="w-5 h-5" />
            Go to My Dashboard
            <ArrowRightIcon className="w-4 h-4" />
          </Link>

          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href={`/discover/sampling/${hobbySlug}`}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Try another sampling
            </Link>
            <span className="text-gray-200">|</span>
            <Link
              href="/discover/quiz/results"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Explore more hobbies
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
