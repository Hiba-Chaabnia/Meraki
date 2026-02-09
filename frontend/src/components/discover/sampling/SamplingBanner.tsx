"use client";

import { motion } from "framer-motion";
import type { HobbyMeta } from "@/lib/hobbyData";

interface SamplingBannerProps {
  hobby: HobbyMeta;
  encouragement?: string;
}

export function SamplingBanner({ hobby, encouragement }: SamplingBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative mt-6 mx-auto max-w-5xl px-4"
    >
      <div
        className="rounded-3xl overflow-hidden px-8 py-12 md:px-14 md:py-16 relative"
        style={{ backgroundColor: hobby.lightColor }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
          style={{ backgroundColor: hobby.color }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15"
          style={{ backgroundColor: hobby.color }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-2xl"
        >
          <p
            className="text-sm font-bold tracking-widest uppercase mb-3"
            style={{ color: hobby.color }}
          >
            Your match
          </p>
          <h1 className="!text-3xl md:!text-5xl mb-4">
            Let&apos;s Dip Your Toes Into {hobby.name}!
          </h1>
          <p className="text-gray-600 text-lg">
            {encouragement ||
              "Pick whatever sounds most fun to you. Zero commitment, just exploration!"}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
