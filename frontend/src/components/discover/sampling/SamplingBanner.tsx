"use client";

import { motion } from "framer-motion";

interface SamplingBannerProps {
  hobbyName: string;
  encouragement?: string;
}

export function SamplingBanner({ hobbyName, encouragement }: SamplingBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative mt-6 mx-auto max-w-5xl px-4"
    >
      <div className="rounded-3xl overflow-hidden px-8 py-12 md:px-14 md:py-16 relative bg-gray-100">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 bg-gray-700" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15 bg-gray-700" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-2xl"
        >
          <p className="text-sm font-bold tracking-widest uppercase mb-3 text-gray-700">
            Your match
          </p>
          <h1 className="text-3xl md:text-5xl font-medium text-gray-900 leading-tight mb-4">
            Let&apos;s Dip Your Toes Into {hobbyName}!
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
