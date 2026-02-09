"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import HeroIconPattern from "@/components/ui/HeroIconPattern";
import { fadeUp, stagger } from "@/components/landing/animations";


export default function DiscoverPage() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative w-full h-screen p-3 md:p-2 sm:p-1 z-10"
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative w-full h-full flex flex-col scallop-xl scallop-mask-y bg-[var(--primary)] text-center items-center justify-between pt-28 md:pt-32 pb-14 md:pb-16"
      >
        {/* Icon wallpaper pattern */}
        <HeroIconPattern useMask={false} iconSet="primary" />



        {/* Content group */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <motion.h1
            variants={fadeUp}
            className="!text-5xl md:!text-7xl max-w-3xl mx-auto mb-6 hero-shine"
          >
            Let&apos;s find your creative match
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A quick and simple quiz to match you with hobbies that fit your
            personality, schedule, and budget.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={fadeUp}>
            <motion.div
              animate={{ rotate: [0, -3, 3, -2, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              whileHover={{ rotate: 0, scale: 1.05 }}
            >
              <Link
                href="/discover/quiz"
                className="inline-block px-8 py-4 rounded-xl font-semibold text-[var(--foreground)] bg-[var(--secondary)] transition-shadow hover:shadow-lg text-base no-underline"
              >
                Take the Quiz
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Secondary link */}
        <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--foreground)]/80 font-medium hover:text-[var(--foreground)] transition-colors"
          >
            Skip to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
