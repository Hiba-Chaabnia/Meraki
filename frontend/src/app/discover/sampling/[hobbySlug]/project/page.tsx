"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getHobby, getProjectData } from "@/lib/hobbyData";

function loadCompletedSteps(hobbySlug: string): Set<number> {
  try {
    const raw = localStorage.getItem(`meraki-project-${hobbySlug}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveCompletedSteps(hobbySlug: string, steps: Set<number>) {
  try {
    localStorage.setItem(`meraki-project-${hobbySlug}`, JSON.stringify([...steps]));
  } catch {}
}

/* ─── Icons ─── */
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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
const DollarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
  </svg>
);
const ShoppingBagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
  </svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ═══════════════════════════════════════════════════════
   Project page — "Try at Home"
   ═══════════════════════════════════════════════════════ */
export default function ProjectPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const project = getProjectData(hobbySlug);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const initialized = useRef(false);
  const allDone = completedSteps.size === project.steps.length;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setCompletedSteps(loadCompletedSteps(hobbySlug));
  }, [hobbySlug]);

  function toggleStep(idx: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      saveCompletedSteps(hobbySlug, next);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
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

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 pt-4 pb-8"
      >
        <div
          className="rounded-3xl px-8 py-10 md:px-12 md:py-14 relative overflow-hidden"
          style={{ backgroundColor: hobby.lightColor }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: hobby.color }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-10"
          >
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: hobby.color }}
            >
              Your first {hobby.name} project
            </p>
            <h1 className="!text-2xl md:!text-4xl mb-2">{project.title}</h1>
            <p className="text-gray-600">{project.subtitle}</p>
            <div className="flex flex-wrap gap-4 mt-5">
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" /> {project.totalTime}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <DollarIcon className="w-4 h-4" /> {project.totalCost}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* ── Intro ── */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-gray-600 text-[15px] leading-relaxed mb-10"
        >
          {project.intro}
        </motion.p>

        {/* ── Shopping list ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-12"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: hobby.lightColor }}
            >
              <ShoppingBagIcon className="w-5 h-5" style={{ color: hobby.color }} />
            </div>
            <h2 className="!text-xl md:!text-2xl">Shopping List</h2>
          </motion.div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {project.shoppingList.map((item, i) => (
              <motion.div
                key={item.name}
                variants={fadeUp}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < project.shoppingList.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[15px] text-gray-700">{item.name}</span>
                  {item.owned && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                      Already own?
                    </span>
                  )}
                </div>
                <span className="flex-shrink-0 text-sm font-medium text-gray-400 ml-4">
                  {item.price}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Steps ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.h2 variants={fadeUp} className="!text-xl md:!text-2xl mb-6">
            Step-by-Step
          </motion.h2>

          <div className="space-y-4">
            {project.steps.map((step, i) => {
              const done = completedSteps.has(i);
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                    done ? "border-green-200" : "border-gray-100"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Step number / check */}
                      <button
                        onClick={() => toggleStep(i)}
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                          done
                            ? "bg-[var(--green)] text-white"
                            : "text-white"
                        }`}
                        style={done ? undefined : { backgroundColor: hobby.color }}
                        aria-label={done ? `Unmark step ${i + 1}` : `Mark step ${i + 1} complete`}
                      >
                        {done ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="!text-base !font-semibold !tracking-normal !text-gray-800">
                            {step.title}
                          </h3>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> {step.duration}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {step.description}
                        </p>
                        {step.tip && (
                          <div
                            className="mt-3 text-sm px-4 py-3 rounded-xl"
                            style={{ backgroundColor: hobby.lightColor + "80", color: hobby.color }}
                          >
                            <span className="font-semibold">Tip:</span> {step.tip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Done section ── */}
        <AnimatePresence>
          {allDone && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5 }}
              className="mt-12 text-center"
            >
              <div
                className="rounded-3xl px-8 py-12 md:px-12"
                style={{ backgroundColor: hobby.lightColor }}
              >
                <SparklesIcon className="w-12 h-12 mx-auto mb-4" style={{ color: hobby.color }} />
                <h2 className="!text-2xl md:!text-3xl mb-3">
                  You&apos;re Done!
                </h2>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {project.doneMessage}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`/discover/sampling/${hobbySlug}/complete`}
                    className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95"
                    style={{ backgroundColor: hobby.color }}
                  >
                    Complete &amp; Add to Dashboard &rarr;
                  </Link>
                  <Link
                    href={`/discover/sampling/${hobbySlug}/journey`}
                    className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Try the 7-Day Path
                  </Link>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
