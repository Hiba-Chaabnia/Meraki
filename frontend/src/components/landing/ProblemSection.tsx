"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import ProblemCard from "../ui/landing/problem-section/ProblemCard";
import SectionBadge from "@/components/ui/SectionBadge";
import { fadeUp, stagger } from "./animations";

/* ── Stacked deck reveal variants (desktop) ── */
const deckCenter: Variants = {
  hidden: { opacity: 1, y: 0, scale: 0.97, zIndex: 30 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    zIndex: 30,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const deckLeft: Variants = {
  hidden: { opacity: 0.7, y: 0, x: "108%", rotate: -4, scale: 0.95, zIndex: 20 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    scale: 1,
    zIndex: 20,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  },
};

const deckRight: Variants = {
  hidden: { opacity: 0.7, y: 0, x: "-108%", rotate: 4, scale: 0.95, zIndex: 10 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    scale: 1,
    zIndex: 10,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  },
};

/* ── Mobile stagger container ── */
const mobileStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

export default function ProblemSection() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="pt-4 pb-4 md:pt-8 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-10">
            <SectionBadge label="The Struggle" />
          </motion.div>

          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="max-w-[280px] md:max-w-none mx-auto">
              You've been meaning to start, <em>but</em>…
            </h2>
          </motion.div>
        </motion.div>

        {/* Problem Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={isDesktop ? undefined : mobileStagger}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-12 lg:gap-16">
            <motion.div variants={isDesktop ? deckLeft : fadeUp} className="relative">
              <ProblemCard
                text="Every hobby looks perfect<br/>until you have to choose."
                textColor="var(--primary-light)"
                image="/images/problem-section/card1.png"
                bgColor="var(--primary)"
                textPosition="bottom"
                tiltDirection="left"
              />
            </motion.div>

            <motion.div variants={isDesktop ? deckCenter : fadeUp} className="relative">
              <ProblemCard
                text="Your starting point is unique.<br/>Your guide should be too."
                textColor="var(--secondary-lighter)"
                image="/images/problem-section/card2.png"
                bgColor="var(--secondary)"
                textPosition="bottom"
                tiltDirection="right"
              />
            </motion.div>

            <motion.div variants={isDesktop ? deckRight : fadeUp} className="relative">
              <ProblemCard
                text="Starting is easy.<br/>Staying is the hard part."
                textColor="var(--primary)"
                image="/images/problem-section/card3.png"
                bgColor="var(--primary-light)"
                textPosition="bottom"
                tiltDirection="left"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
