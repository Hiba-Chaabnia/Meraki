"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MatchCard as MatchCardType } from "@/lib/types/quiz";
import type { SectionTheme } from "@/components/discover/quiz/sectionTheme";

interface MatchCardProps {
  match: MatchCardType;
  index: number;
  theme?: SectionTheme;
}

const MAX_TAG_CHARS = 16;

function normalizeTags(tags: string[]) {
  return tags.slice(0, 3).map(tag =>
    tag.length > MAX_TAG_CHARS ? "etc" : tag
  );
}

export function MatchCard({ match, index, theme }: MatchCardProps) {
  const cardBg = theme ? theme.bg : match.lightColor + "40";
  const accentColor = theme ? theme.accent : match.color;
  const tagBg = theme ? theme.light : match.color + "20";
  const tagText = theme ? theme.accent : match.color;

  const tags = normalizeTags(match.tags);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"

    >
      <Link
        href={`/discover/sampling/${match.slug}?from=quiz`}
        className={`block p-5 rounded-3xl transition-all duration-300 hover:shadow-xl shadow-sm group h-full flex flex-col relative overflow-hidden bg-white/50 backdrop-blur-sm border`}
        style={{ backgroundColor: theme ? theme.bg : "", borderColor: accentColor }}
      >
        {/* ROW 1 */}
        <div
          className="flex-shrink-0 flex flex-col mb-3 relative z-10 w-full pb-3"
          style={{ borderColor: accentColor }}
        >
          {/* Title + Percentage */}
          <div className="flex items-center justify-between w-full mb-2">
            <p
              className="text-xl font-semibold truncate pr-2"
              style={{ color: accentColor }}
            >
              {match.name}
            </p>
            <div
              className="text-xl font-semibold flex-shrink-0"
              style={{ color: accentColor }}
            >
              {match.matchPercent}%
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 w-full">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="
                  h-6
                  px-2
                  flex
                  items-center
                  text-[10px]
                  font-bold
                  rounded-full
                  border
                  tracking-wider
                  whitespace-nowrap
                  overflow-hidden
                "
                style={{
                  backgroundColor: tagBg,
                  borderColor: tagText,
                  color: tagText,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ROW 2: Description */}
        <div className="flex-grow relative z-10 min-h-0 overflow-hidden flex flex-col justify-start">
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-gray-700 text-sm font-medium leading-relaxed">
              {match.tagline}
            </p>
          </div>
        </div>

        {/* ROW 3: Button */}
        <div className="flex-shrink-0 pt-3 mt-3 relative z-10 w-full">
          <div
            className="w-full py-3 border rounded-xl flex items-center justify-center font-bold tracking-widest text-xs transition-transform group-hover:scale-[1.02]"
            style={{
              backgroundColor: theme ? theme.light : "rgba(0,0,0,0.05)",
              color: accentColor,
              borderColor: accentColor,
            }}
          >
            Start Sampling
            <svg
              className="w-4 h-4 ml-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
