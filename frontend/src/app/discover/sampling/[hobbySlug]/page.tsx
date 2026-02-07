"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ScallopedButton } from "@/components/ui/ScallopedButton";
import { getHobby } from "@/lib/hobbyData";
import {
  triggerSamplingPreview,
  pollSamplingPreviewStatus,
  getSamplingResult,
  saveSamplingResult,
  type SamplingPreviewResult,
} from "@/app/actions/sampling";

/* ─── Animation variants ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ─── SVG Icons ─── */
const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
  </svg>
);

const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21c-4-4-8-7.33-8-11a8 8 0 1116 0c0 3.67-4 7-8 11z" />
    <path d="M12 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
  </svg>
);

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/* ─── Perk row ─── */
function Perk({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex items-start gap-3 text-[15px] text-gray-600 leading-snug">
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: color + "22" }}
      >
        <CheckIcon className="w-3 h-3" style={{ color }} />
      </span>
      {children}
    </li>
  );
}

/* ─── Detail pill ─── */
function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="font-medium text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ─── Recommended badge ─── */
function RecommendedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-700">
      <StarIcon className="w-3 h-3" />
      Recommended for you
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════ */
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

  const backHref = from === "discover" ? "/discover" : "/discover/quiz/results";
  const backLabel = from === "discover" ? "Back to discover" : "Back to quiz results";

  // Sampling preview state
  const [previewResult, setPreviewResult] = useState<SamplingPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  // Fetch sampling preview on mount
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function startPolling(jobId: string) {
      setPreviewJobId(jobId);
      pollTimer = setInterval(async () => {
        const status = await pollSamplingPreviewStatus(jobId);
        if (cancelled) return;

        if (!("status" in status)) {
          if (pollTimer) clearInterval(pollTimer);
          setPreviewError(status.error);
          setPreviewLoading(false);
          return;
        }

        if (status.status === "completed" && status.result) {
          if (pollTimer) clearInterval(pollTimer);
          setPreviewResult(status.result);
          sessionStorage.setItem(
            `sampling-preview-${hobbySlug}`,
            JSON.stringify(status.result)
          );
          // Persist to DB
          saveSamplingResult(hobbySlug, status.result).catch(() => {});
          setPreviewLoading(false);
        } else if (status.status === "failed") {
          if (pollTimer) clearInterval(pollTimer);
          setPreviewError(status.error || "Preview generation failed");
          setPreviewLoading(false);
        }
      }, 2000);
    }

    async function fetchPreview() {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        // 1. Check sessionStorage first (fastest)
        const storedResult = sessionStorage.getItem(`sampling-preview-${hobbySlug}`);
        if (storedResult) {
          try {
            const data: SamplingPreviewResult = JSON.parse(storedResult);
            // Accept partial results — don't require all 3 fields
            if (data.recommendation || data.micro_activity || (data.videos && data.videos.length > 0)) {
              setPreviewResult(data);
              setPreviewLoading(false);
              return;
            }
          } catch {
            sessionStorage.removeItem(`sampling-preview-${hobbySlug}`);
          }
        }

        // 2. Check database (survives page refresh / restart)
        const dbResult = await getSamplingResult(hobbySlug);
        if (cancelled) return;
        if (dbResult.data) {
          setPreviewResult(dbResult.data);
          sessionStorage.setItem(
            `sampling-preview-${hobbySlug}`,
            JSON.stringify(dbResult.data)
          );
          setPreviewLoading(false);
          return;
        }

        // 3. Check if there's an existing job still running
        const existingJobId = sessionStorage.getItem(`sampling-job-${hobbySlug}`);
        if (existingJobId) {
          setPreviewJobId(existingJobId);
          const status = await pollSamplingPreviewStatus(existingJobId);
          if (cancelled) return;
          if ("status" in status) {
            if (status.status === "completed" && status.result) {
              setPreviewResult(status.result);
              sessionStorage.setItem(
                `sampling-preview-${hobbySlug}`,
                JSON.stringify(status.result)
              );
              saveSamplingResult(hobbySlug, status.result).catch(() => {});
              setPreviewLoading(false);
              return;
            } else if (status.status === "pending" || status.status === "running") {
              startPolling(existingJobId);
              return;
            }
          }
        }

        // 4. Only trigger a new job if no existing result or job
        const { job_id, error } = await triggerSamplingPreview(hobbySlug);
        if (cancelled) return;
        if (error || !job_id) {
          setPreviewError(error || "Failed to start preview");
          setPreviewLoading(false);
          return;
        }

        setPreviewJobId(job_id);
        sessionStorage.setItem(`sampling-job-${hobbySlug}`, job_id);
        startPolling(job_id);
      } catch (e) {
        if (!cancelled) {
          setPreviewError(`Failed to fetch preview: ${e}`);
          setPreviewLoading(false);
        }
      }
    }

    fetchPreview();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [hobbySlug]);

  // Determine which path is recommended
  const recommendedPath = previewResult?.recommendation?.primary_path;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Top bar ── */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>
      </div>

      {/* ── Banner ── */}
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
              {previewResult?.recommendation?.encouragement ||
                "Pick whatever sounds most fun to you. Zero commitment, just exploration!"}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Loading/Error State ── */}
      {previewLoading && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-4">
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            <p className="text-gray-500">
              Personalizing your experience...
            </p>
          </div>
        </div>
      )}

      {previewError && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
            Unable to personalize recommendations. Showing default options.
          </div>
        </div>
      )}

      {/* ── Pathway cards ── */}
      <motion.div
        className="max-w-5xl mx-auto px-4 py-12"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1 — Watch First */}
          <motion.div variants={fadeUp}>
            <PathwayCardShell
              badge="Zero Commitment"
              badgeColor={hobby.color}
              icon={
                <PlayIcon className="w-8 h-8" style={{ color: hobby.color }} />
              }
              iconBg={hobby.lightColor}
              title="Watch First"
              description="Not ready to dive in? See what a real session looks like and get a feel for the vibe."
              perks={[
                "Curated video showing the hobby in action",
                "See what tools and space you'd need",
                "Get inspired by real creators",
              ]}
              perkColor={hobby.color}
              details={[
                { label: "Time:", value: "10\u201315 minutes" },
                { label: "Cost:", value: "Free" },
              ]}
              isRecommended={recommendedPath === "watch"}
              button={
                <Link href={previewJobId ? `${base}/watch?jobId=${previewJobId}` : `${base}/watch`}>
                  <div className="pointer-events-none">
                    <ScallopedButton
                      tabIndex={-1}
                      bgColor={hobby.color}
                      scallopSize="sm"
                      className="w-full"
                    >
                      Watch Now
                    </ScallopedButton>
                  </div>
                </Link>
              }
            />
          </motion.div>

          {/* Card 2 — Micro-Try */}
          <motion.div variants={fadeUp}>
            <PathwayCardShell
              badge="Instant Taste"
              badgeColor="var(--lavender)"
              icon={
                <SparkleIcon className="w-8 h-8" style={{ color: "var(--lavender)" }} />
              }
              iconBg="#E8E2F7"
              title="Micro-Try"
              description="Try a tiny activity right now — no prep, no supplies, just 5 minutes and your hands."
              perks={[
                "A bite-sized activity you can do immediately",
                "No materials or setup required",
                "Instant sense of what the hobby feels like",
              ]}
              perkColor="var(--lavender)"
              details={[
                { label: "Time:", value: "5 minutes" },
                { label: "Cost:", value: "Free" },
              ]}
              isRecommended={recommendedPath === "micro"}
              button={
                <Link href={previewJobId ? `${base}/micro?jobId=${previewJobId}` : `${base}/micro`}>
                  <div className="pointer-events-none">
                    <ScallopedButton
                      tabIndex={-1}
                      bgColor="var(--lavender)"
                      scallopSize="sm"
                      className="w-full"
                    >
                      Try It Now
                    </ScallopedButton>
                  </div>
                </Link>
              }
            />
          </motion.div>

          {/* Card 3 — Find Local */}
          <motion.div variants={fadeUp}>
            <PathwayCardShell
              badge="Learn With Others"
              badgeColor="var(--green)"
              icon={
                <MapPinIcon className="w-8 h-8" style={{ color: "var(--green)" }} />
              }
              iconBg="#D4EFCF"
              title="Find Something Nearby"
              description="Discover one-time workshops and trial classes near you — meet people, learn together!"
              perks={[
                "Hand-picked beginner-friendly spots near you",
                "Single sessions only (no long commitments!)",
                "Reviews from other beginners like you",
              ]}
              perkColor="var(--green)"
              note="We'll need your location for this one"
              isRecommended={recommendedPath === "local"}
              button={
                <Link href={`${base}/local`}>
                  <div className="pointer-events-none">
                    <ScallopedButton
                      tabIndex={-1}
                      bgColor="var(--green)"
                      scallopSize="sm"
                      className="w-full"
                    >
                      Find Local Spots
                    </ScallopedButton>
                  </div>
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
            className="mt-8 bg-white rounded-xl border border-gray-100 p-6"
          >
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Why we recommend this: </span>
              {previewResult.recommendation.reason}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Shared pathway card shell
   ═══════════════════════════════════════════════════════ */
function PathwayCardShell({
  badge,
  badgeColor,
  icon,
  iconBg,
  title,
  description,
  perks,
  perkColor,
  details,
  note,
  button,
  isRecommended,
}: {
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  perks: string[];
  perkColor: string;
  details?: { label: string; value: string }[];
  note?: string;
  button: React.ReactNode;
  isRecommended?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-shadow h-full flex flex-col ${
        isRecommended ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100"
      }`}
    >
      <div className="p-7 md:p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span
            className="inline-block text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
            style={{ backgroundColor: badgeColor + "18", color: badgeColor }}
          >
            {badge}
          </span>
          {isRecommended && <RecommendedBadge />}
        </div>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        <h2 className="!text-xl md:!text-2xl !leading-snug mb-2">{title}</h2>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
          {description}
        </p>

        <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">
          What you&apos;ll get
        </p>
        <ul className="space-y-3 mb-6">
          {perks.map((perk) => (
            <Perk key={perk} color={perkColor}>{perk}</Perk>
          ))}
        </ul>

        <div className="mt-auto space-y-2">
          {details?.map((d) => (
            <DetailPill key={d.label} label={d.label} value={d.value} />
          ))}
          {note && <p className="text-xs text-gray-400 italic">{note}</p>}
        </div>
      </div>

      <div className="px-7 md:px-8 pb-7 md:pb-8 pt-2">
        {button}
      </div>
    </motion.div>
  );
}
