"use client";

import { motion } from "framer-motion";
import type { Mood } from "@/lib/dashboardData";
import { moodEmojis } from "@/lib/dashboardData";

interface EmotionalCheckInProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

const moods: Mood[] = ["loved", "good", "okay", "frustrated", "discouraged"];

export function EmotionalCheckIn({ selected, onSelect }: EmotionalCheckInProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-600">How did it feel?</p>
      <div className="flex gap-2">
        {moods.map((mood) => {
          const { emoji, label } = moodEmojis[mood];
          const isActive = selected === mood;
          return (
            <motion.button
              key={mood}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(mood)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-orange-50 ring-2 ring-[var(--secondary)]"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              aria-label={label}
            >
              <span className="text-xl">{emoji}</span>
              <span className={`text-[10px] font-medium ${isActive ? "text-[var(--secondary)]" : "text-gray-400"}`}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
