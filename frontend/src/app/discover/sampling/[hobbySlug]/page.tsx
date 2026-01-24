"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PlayIcon, ArrowLeftIcon, HomeIcon } from "@/components/ui/Icons";
import { PathwayCard } from "@/components/discover/sampling/PathwayCard";
import { useSamplingPreview } from "@/hooks/useSamplingPreview";
import { getHobby } from "@/lib/hobbyData";

import type { SectionTheme } from "@/components/discover/quiz/sectionTheme";

/* ─── Themes ─── */
const THEME_PRIMARY: SectionTheme = {
  bg: "#EBF2FE",
  accent: "#5396F4",
  border: "#BAD5FB",
  light: "#D6E8FD",
  textOnAccent: "#ffffff",
};

const THEME_SECONDARY: SectionTheme = {
  bg: "#f5f9e0",
  accent: "#CFE251",
  border: "#DDEB85",
  light: "#EBF4B8",
  textOnAccent: "#292929",
};

/* ─── Animation variants ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function SamplingPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const hobby = getHobby(hobbySlug);
  const base = `/discover/sampling/${hobbySlug}`;

  const backHref = from === "dashboard" ? "/dashboard" : from === "discover" ? "/discover" : "/discover/quiz/results";
  const backLabel = from === "dashboard" ? "Back to dashboard" : from === "discover" ? "Back to discover" : "Back to quiz results";

  const { previewResult, previewLoading, previewError, previewJobId } = useSamplingPreview(hobbySlug);

  const recommendedPath = previewResult?.recommendation?.primary_path;

  return (
    <div className="h-screen w-screen bg-[var(--background)] overflow-y-auto">
      {/* ── Top bar ── */}
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
            <p className="text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
              Dip your toes into <em className="font-bold lowercase">{hobby.name}</em>
            </p>
            <p className="text-md md:text-lg font-medium text-[var(--foreground)] mt-2">
              Pick whatever sounds most fun to you. Zero commitment, just exploration.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="p-2 -mr-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            title="Dashboard"
          >
            <HomeIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Loading/Error State ── */}
      {previewLoading && (
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-yellow-50 rounded-xl border border-yellow-300 p-2 flex items-center gap-1">
            <div className="animate-spin w-5 h-5 border-2 border-yellow-300 border-t-yellow-600 rounded-full" />
            <p className="text-yellow-500 pl-2">
              Personalizing your experience...
            </p>
          </div>
        </div>
      )}

      {previewError && (
        <div className="max-w-5xl mx-auto px-4 ">
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-red-800 text-sm ">
            Unable to personalize recommendations. Showing default options.
          </div>
        </div>
      )}

      {/* ── Pathway cards ── */}
      <motion.div
        className="w-full mx-auto px-4 py-12"
        variants={stagger}
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
                { label: "Time:", value: "10\u201315 min" },
                { label: "Cost:", value: "Free" },
              ]}
              isRecommended={recommendedPath === "watch"}
              button={
                <Link
                  href={previewJobId ? `${base}/watch?jobId=${previewJobId}` : `${base}/watch`}
                  className="w-full py-3 border rounded-xl flex items-center justify-center font-bold tracking-widest text-xs transition-transform hover:scale-[1.02] group"
                  style={{
                    backgroundColor: THEME_PRIMARY.light,
                    color: THEME_PRIMARY.accent,
                    borderColor: THEME_PRIMARY.accent,
                  }}
                >
                  Watch Now
                  <PlayIcon className="w-4 h-4 ml-2" />
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
                  href={previewJobId ? `${base}/micro?jobId=${previewJobId}` : `${base}/micro`}
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
                  href={`${base}/local`}
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
        {previewResult?.recommendation?.reason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl p-6"
          >
            <p className="text-sm text-center text-gray-500">
              <span className="font-medium text-gray-700">Why we recommend this: </span>
              {previewResult.recommendation.reason}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
