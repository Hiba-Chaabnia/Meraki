"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { THEME_PRIMARY } from "@/lib/sectionTheme";

const stagger = staggerContainer(0.08);

/** Decorative flower cluster — stands in for an empty-state illustration. */
const FLOWERS = [
  { size: 26, color: "var(--primary-light)", spinDuration: 9 },
  { size: 44, color: "var(--primary)", spinDuration: 6 },
  { size: 32, color: "var(--secondary)", spinDuration: 7.5 },
] as const;

interface NoMatchesStateProps {
  quizPath?: string;
  dashboardPath?: string;
}

export function NoMatchesState({
  quizPath = "/discover/quiz",
  dashboardPath = "/dashboard",
}: NoMatchesStateProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-md text-center"
      >
        {/* Flower cluster */}
        <motion.div
          variants={fadeUp}
          className="flex items-end justify-center gap-2 mb-8"
        >
          {FLOWERS.map((f, i) => (
            <FlowerShape
              key={i}
              size={f.size}
              color={f.color}
              spin
              spinDuration={f.spinDuration}
              spinDirection={i % 2 === 0 ? "clockwise" : "counterclockwise"}
              gradientId={`no-matches-flower-${i}`}
            />
          ))}
        </motion.div>

        {/* Card */}
        <motion.div
          variants={fadeUp}
          className="rounded-3xl border p-8 shadow-sm"
          style={{
            backgroundColor: THEME_PRIMARY.bg,
            borderColor: THEME_PRIMARY.accent,
          }}
        >
          <h1 className="page-title mb-3">
            No matches <em>yet</em>
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            Take the quiz and we&apos;ll match you with hobbies that fit your time,
            your budget, and the way you like to make things. It only takes a few
            minutes.
          </p>

          <motion.div
            animate={{ rotate: [0, -3, 3, -2, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            className="inline-block"
          >
            <Button href={quizPath} variant="secondary" size="lg" noScaleOnHover>
              Take the Quiz
            </Button>
          </motion.div>
        </motion.div>

        {/* Quiet secondary exit */}
        <motion.p
          variants={fadeUp}
          className="text-sm text-[var(--foreground)]/60 mt-6"
        >
          Not right now?{" "}
          <Link
            href={dashboardPath}
            className="font-medium hover:text-[var(--foreground)] transition-colors"
          >
            <em>skip to dashboard</em>
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
