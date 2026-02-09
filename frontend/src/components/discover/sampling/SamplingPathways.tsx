"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftIcon, HomeIcon } from "@/components/ui/Icons";
import { PathwayCard } from "./PathwayCard";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { THEME_PRIMARY, THEME_SECONDARY } from "@/lib/sectionTheme";

export interface SamplingPathwaysProps {
  hobbyName: string;
  backHref: string;
  backLabel: string;
  dashboardHref: string;
  watchHref: string;
  microHref: string;
  localHref: string;
  /** Which card wears the "Recommended" badge. */
  recommendedPath?: "watch" | "micro" | "local";
  /** Rendered under the cards as "Why we recommend this". */
  recommendationReason?: string;
  loading?: boolean;
  error?: boolean;
}

export function SamplingPathways({
  hobbyName,
  backHref,
  backLabel,
  dashboardHref,
  watchHref,
  microHref,
  localHref,
  recommendedPath,
  recommendationReason,
  loading = false,
  error = false,
}: SamplingPathwaysProps) {
  return (
    <div className="h-screen w-screen bg-[var(--background)] overflow-y-auto">
      {/* ── Header Row ── */}
      <div className="w-full mx-auto px-4 pt-8 mb-8 ">
        <div className="grid grid-cols-[auto_1fr_auto] items-top gap-4">
          <Link
            href={backHref}
            className="p-2 -ml-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            title={backLabel}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>

          <div className="text-center">
            <h1 className="page-title">
              Dip your toes into <em className="font-bold lowercase">{hobbyName}</em>
            </h1>
            <p className="text-base md:text-lg font-medium text-[var(--foreground)] mt-2">
              Pick whatever sounds most fun to you. Zero commitment, just exploration.
            </p>
          </div>

          <Link
            href={dashboardHref}
            className="p-2 -mr-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            title="Dashboard"
          >
            <HomeIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Loading/Error State ── */}
      {loading && (
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-yellow-50 rounded-xl border border-yellow-300 p-2 flex items-center gap-1">
            <div className="animate-spin w-5 h-5 border-2 border-yellow-300 border-t-yellow-600 rounded-full" />
            <p className="text-yellow-500 pl-2">Personalizing your experience...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-5xl mx-auto px-4 ">
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-red-800 text-sm ">
            Unable to personalize recommendations. Showing default options.
          </div>
        </div>
      )}

      {/* ── Pathway cards ── */}
      <motion.div
        className="w-full mx-auto px-4 py-12"
        variants={staggerContainer(0.12)}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={fadeUp}>
            <PathwayCard
              title="Watch First"
              description="Not ready to dive in? See what a real session looks like and get a feel for the vibe."
              perks={[
                "Curated video showing the hobby in action",
                "See what tools and space you'd need",
                "Get inspired by real creators",
              ]}
              theme={THEME_PRIMARY}
              details={[
                { label: "Time:", value: "10–15 min" },
                { label: "Cost:", value: "Free" },
              ]}
              isRecommended={recommendedPath === "watch"}
              button={
                <Link
                  href={watchHref}
                  className="w-full py-3 border rounded-xl flex items-center justify-center font-bold tracking-widest text-xs transition-transform hover:scale-[1.02] group"
                  style={{
                    backgroundColor: THEME_PRIMARY.light,
                    color: THEME_PRIMARY.accent,
                    borderColor: THEME_PRIMARY.accent,
                  }}
                >
                  Watch Now
                </Link>
              }
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <PathwayCard
              title="Micro-Try"
              description="Try a tiny activity right now — no prep, no supplies, just 5 minutes and your hands."
              perks={[
                "A bite-sized activity you can do immediately",
                "No materials or setup required",
                "Instant sense of what the hobby feels like",
              ]}
              theme={THEME_SECONDARY}
              details={[
                { label: "Time:", value: "5 min" },
                { label: "Cost:", value: "Free" },
              ]}
              isRecommended={recommendedPath === "micro"}
              button={
                <Link
                  href={microHref}
                  className="w-full py-3 border rounded-xl flex items-center justify-center font-bold tracking-widest text-xs transition-transform hover:scale-[1.02] group"
                  style={{
                    backgroundColor: THEME_SECONDARY.light,
                    color: THEME_SECONDARY.accent,
                    borderColor: THEME_SECONDARY.accent,
                  }}
                >
                  Try It Now
                </Link>
              }
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <PathwayCard
              title="Find Something Nearby"
              description="Discover one-time workshops and trial classes near you — meet people, learn together!"
              perks={[
                "Hand-picked beginner-friendly spots near you",
                "Single sessions only (no long commitments!)",
                "Reviews from other beginners like you",
              ]}
              theme={THEME_PRIMARY}
              note="We'll need your location"
              isRecommended={recommendedPath === "local"}
              button={
                <Link
                  href={localHref}
                  className="w-full py-3 border rounded-xl flex items-center justify-center font-bold tracking-widest text-xs transition-transform hover:scale-[1.02] group"
                  style={{
                    backgroundColor: THEME_PRIMARY.light,
                    color: THEME_PRIMARY.accent,
                    borderColor: THEME_PRIMARY.accent,
                  }}
                >
                  Find Local Spots
                </Link>
              }
            />
          </motion.div>
        </div>

        {/* Recommendation reason */}
        {recommendationReason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl p-6"
          >
            <p className="text-sm text-center text-gray-500">
              <span className="font-medium text-gray-700">Why we recommend this: </span>
              {recommendationReason}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
