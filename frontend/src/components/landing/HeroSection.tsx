"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroIconPattern from "@/components/ui/HeroIconPattern";
import { fadeUp, stagger } from "./animations";

export default function HeroSection() {
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
        className="relative w-full h-full flex flex-col rounded-t-[1rem] scallop-xl scallop-mask-bottom bg-[var(--primary)] text-center items-center justify-between pt-28 md:pt-32 pb-14 md:pb-16"
      >
        {/* Icon wallpaper pattern */}
        <HeroIconPattern useMask={true} iconSet="primary" />

        {/* Top bar */}
        <motion.div
          variants={fadeUp}
          className="absolute top-6 sm:top-8 left-0 right-0 z-10 flex items-center justify-between px-5 sm:px-8 md:px-12"
        >
          <Image
            src="/icons/logo/logo-light.svg"
            alt="Meraki"
            width={140}
            height={40}
            className="object-contain"
            priority
          />
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[var(--background)] border border-[var(--background)] bg-transparent hover:bg-transparent px-4 py-2 rounded-lg transition-colors no-underline sm:text-[var(--background)] sm:bg-transparent sm:border sm:border-[var(--background)] sm:hover:text-[var(--secondary)] sm:hover:border-[var(--secondary)]"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="hidden sm:inline-block text-sm font-medium text-[var(--foreground)] bg-[var(--background)]  hover:bg-[var(--secondary)] px-4 py-2 rounded-lg transition-colors no-underline"
            >
              Sign up
            </Link>
          </div>
        </motion.div>

        {/* Content group */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <motion.h1
            variants={fadeUp}
            className="!text-5xl md:!text-7xl max-w-3xl mx-auto mb-6 hero-shine"
          >
            Fall in <em>Love</em> <br />
            with the <em>Art</em> of Making
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From someday to something made.
            <br />
            Discover creative hobbies made for you,
            <br />
            with guided paths and gentle nudges along the way.
          </motion.p>

          <motion.div variants={fadeUp}>
            <motion.div
              animate={{ rotate: [0, -3, 3, -2, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              whileHover={{ rotate: 0, scale: 1.05 }}
            >
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 rounded-xl font-semibold text-[var(--foreground)] bg-[var(--secondary)] transition-shadow hover:shadow-lg text-base no-underline"
              >
                Get Started
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="relative z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-white/40" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
