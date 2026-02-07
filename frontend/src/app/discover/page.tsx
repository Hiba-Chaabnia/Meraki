"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { ScallopedButton } from "@/components/ui/ScallopedButton";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-16">
      <motion.div
        className="max-w-2xl w-full flex flex-col items-center gap-8"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Banner pill */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <div
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--primary), var(--secondary-lighter))",
            }}
          >
            <FlowerShape
              size={20}
              color="var(--background)"
              spin
              spinDuration={4}
              spinDirection="counterclockwise"
            />
            <span className="uppercase text-sm font-black tracking-widest text-[var(--background)]">
              Discover
            </span>
            <FlowerShape
              size={20}
              color="var(--background)"
              spin
              spinDuration={4}
              spinDirection="clockwise"
            />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div variants={fadeUp} className="text-center">
          <h1>Let&apos;s find your creative match</h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          className="text-center text-lg md:text-xl text-[var(--foreground)]/70 max-w-lg"
        >
          A quick, playful quiz to match you with hobbies that fit your
          personality, schedule, and budget.
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={fadeUp}>
          <Link href="/discover/quiz">
            <ScallopedButton
              bgColor="var(--primary)"
              textColor="var(--background)"
              scallopSize="sm"
            >
              Take the Quiz
            </ScallopedButton>
          </Link>
        </motion.div>

        {/* Skip link */}
        <motion.div variants={fadeUp}>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60 transition-colors"
          >
            Skip to Dashboard &rarr;
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
