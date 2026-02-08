"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getHobby } from "@/lib/hobbyData";
import { ScallopedButton } from "@/components/ui/ScallopedButton";
import {
  triggerSamplingPreview,
  type SamplingPreviewResult,
} from "@/app/actions/sampling";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_CREWAI_API_URL || "http://localhost:8000";

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

interface MicroActivity {
  title: string;
  instruction: string;
  duration: string;
  why_it_works: string;
}

// Module-level cache — survives unmount/remount during client-side navigation
const activityCache = new Map<string, MicroActivity>();

/* Default micro activities by hobby - fallback if API doesn't return one */
const defaultActivities: Record<string, MicroActivity> = {
  pottery: {
    title: "Feel the Form",
    instruction: "Grab any small object near you (a mug, a fruit, a stress ball). Close your eyes and slowly run your fingers over its entire surface. Notice the curves, edges, weight, and temperature. Imagine you're memorizing its shape to recreate it from clay.",
    duration: "2-3 minutes",
    why_it_works: "Potters develop incredible tactile sensitivity. This exercise builds that same awareness.",
  },
  watercolor: {
    title: "See Like a Painter",
    instruction: "Look at the nearest window or light source. Instead of seeing 'a window', try to see it as patches of color and light. Notice: What's the lightest spot? The darkest? Can you spot at least 3 different shades?",
    duration: "2-3 minutes",
    why_it_works: "Watercolor is all about seeing light and shadow. This trains your eye to break down what you see.",
  },
  knitting: {
    title: "Rhythm Check",
    instruction: "Tap your fingers on a surface in a steady rhythm: tap-tap, tap-tap (like knit-purl, knit-purl). Try to maintain this rhythm for 60 seconds without speeding up or slowing down. Notice how your mind wanders but your hands stay steady.",
    duration: "1-2 minutes",
    why_it_works: "Knitting is meditative because of its rhythm. This gives you a taste of that calming repetition.",
  },
  drawing: {
    title: "Blind Contour",
    instruction: "Look at your non-dominant hand. Without looking at the paper, draw its outline continuously for 60 seconds. Don't lift your pen. The result will look wonky — that's perfect! The point is training your eye-hand connection.",
    duration: "1-2 minutes",
    why_it_works: "This classic exercise is used by professional artists to warm up and stay loose.",
  },
  photography: {
    title: "Frame the Moment",
    instruction: "Make a rectangle with your fingers (like a movie director). Look around your space and find 3 different 'frames' that look interesting — a corner of a bookshelf, light on a wall, an object's shadow. What makes each frame compelling?",
    duration: "2-3 minutes",
    why_it_works: "Photography is about seeing. Your phone camera is just a tool — your eye is the real camera.",
  },
  default: {
    title: "Mindful Observation",
    instruction: "Pick any object within arm's reach. Spend 2 minutes examining it as if you've never seen it before. Notice its texture, weight, how light hits it, any imperfections. Try to find 5 details you've never noticed.",
    duration: "2-3 minutes",
    why_it_works: "Every creative hobby starts with learning to see the world differently. This builds that skill.",
  },
};

export default function MicroPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const cached = activityCache.get(hobbySlug);
  const [activity, setActivity] = useState<MicroActivity>(
    cached || defaultActivities[hobbySlug] || defaultActivities.default
  );
  const [isGenerated, setIsGenerated] = useState(!!cached);

  const searchParams = useSearchParams();

  // Load activity: check cache → sessionStorage → URL jobId → poll backend → default
  useEffect(() => {
    // If we already have a cached generated activity, skip fetching
    if (activityCache.has(hobbySlug)) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function applyActivity(data: SamplingPreviewResult) {
      if (data.micro_activity) {
        const act: MicroActivity = {
          title: data.micro_activity.title,
          instruction: data.micro_activity.instruction,
          duration: data.micro_activity.duration,
          why_it_works: data.micro_activity.why_it_works,
        };
        activityCache.set(hobbySlug, act);
        // Store the FULL result so the parent sampling page can use it on back-nav
        try {
          sessionStorage.setItem(`sampling-preview-${hobbySlug}`, JSON.stringify(data));
        } catch { /* sessionStorage unavailable */ }
        setActivity(act);
        setIsGenerated(true);
      }
    }

    async function pollBackend(jobId: string) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/sampling/preview/${jobId}`);
          if (cancelled) return;
          if (!res.ok) {
            if (pollTimer) clearInterval(pollTimer);
            return;
          }
          const data = await res.json();
          if (data.status === "completed" && data.result) {
            if (pollTimer) clearInterval(pollTimer);
            applyActivity(data.result);
          } else if (data.status === "failed") {
            if (pollTimer) clearInterval(pollTimer);
          }
        } catch {
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 2000);
    }

    async function loadActivity() {
      // 0. Check sessionStorage for data from parent page
      try {
        const stored = sessionStorage.getItem(`sampling-preview-${hobbySlug}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.micro_activity) {
            const act: MicroActivity = {
              title: parsed.micro_activity.title,
              instruction: parsed.micro_activity.instruction,
              duration: parsed.micro_activity.duration,
              why_it_works: parsed.micro_activity.why_it_works,
            };
            activityCache.set(hobbySlug, act);
            setActivity(act);
            setIsGenerated(true);
            return;
          }
        }
      } catch { /* sessionStorage unavailable */ }

      // 1. If jobId is in the URL (passed from parent page), poll it directly
      const jobIdParam = searchParams.get("jobId");
      if (jobIdParam) {
        try {
          const res = await fetch(`${BACKEND_URL}/sampling/preview/${jobIdParam}`);
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" && data.result) {
              applyActivity(data.result);
              return;
            }
            if (data.status === "pending" || data.status === "running") {
              await pollBackend(jobIdParam);
              return;
            }
          }
        } catch {
          // Job not found or backend down — fall through to trigger new
        }
      }

      // 2. Check sessionStorage for a previously-started job ID
      try {
        const storedJobId = sessionStorage.getItem(`sampling-job-${hobbySlug}`);
        if (storedJobId) {
          const res = await fetch(`${BACKEND_URL}/sampling/preview/${storedJobId}`);
          if (!cancelled && res.ok) {
            const data = await res.json();
            if (data.status === "completed" && data.result) {
              applyActivity(data.result);
              return;
            }
            if (data.status === "pending" || data.status === "running") {
              await pollBackend(storedJobId);
              return;
            }
          }
        }
      } catch { /* ignore */ }

      // 3. No jobId — trigger a new job via server action
      const { job_id, error } = await triggerSamplingPreview(hobbySlug);
      if (cancelled) return;
      if (error || !job_id) {
        // Use default activity (already set in state)
        return;
      }
      await pollBackend(job_id);
    }

    loadActivity();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [hobbySlug, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-6">
        <Link
          href={`/discover/sampling/${hobbySlug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sampling options
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ backgroundColor: "#E8E2F7" }}
          >
            <SparkleIcon className="w-8 h-8" style={{ color: "var(--lavender)" }} />
          </div>
          <h1 className="!text-3xl md:!text-4xl mb-4">
            {activity.title}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            A tiny taste of {hobby.name.toLowerCase()} — no materials needed, just you.
          </p>
        </motion.div>

        {/* Activity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {!started ? (
            <div className="p-8 md:p-10 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--lavender)]" />
                {activity.duration}
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                {activity.instruction}
              </p>
              <ScallopedButton
                bgColor="var(--lavender)"
                scallopSize="sm"
                onClick={() => setStarted(true)}
              >
                I&apos;m Ready — Let&apos;s Go!
              </ScallopedButton>
            </div>
          ) : !completed ? (
            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <p className="text-sm font-bold tracking-widest uppercase text-[var(--lavender)] mb-4">
                  Your micro activity
                </p>
                <p className="text-gray-700 text-lg leading-relaxed max-w-xl mx-auto">
                  {activity.instruction}
                </p>
              </div>

              <div
                className="rounded-xl p-6 mb-8"
                style={{ backgroundColor: "#E8E2F7" + "40" }}
              >
                <p className="text-sm font-medium text-[var(--lavender)] mb-2">Why this works</p>
                <p className="text-gray-600 text-sm">{activity.why_it_works}</p>
              </div>

              <div className="text-center">
                <ScallopedButton
                  bgColor="var(--lavender)"
                  scallopSize="sm"
                  onClick={() => setCompleted(true)}
                >
                  Done! How Did It Feel?
                </ScallopedButton>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                style={{ backgroundColor: "var(--green)" + "20" }}
              >
                <CheckCircleIcon className="w-8 h-8" style={{ color: "var(--green)" }} />
              </motion.div>
              <h2 className="!text-2xl mb-3">Nice work!</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                You just got a tiny taste of what makes {hobby.name.toLowerCase()} special.
                Want to explore more?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/discover/sampling/${hobbySlug}/local`}>
                  <ScallopedButton
                    bgColor="var(--green)"
                    scallopSize="sm"
                  >
                    Find a Local Class
                  </ScallopedButton>
                </Link>
                <Link href={`/discover/sampling/${hobbySlug}/watch`}>
                  <ScallopedButton
                    bgColor={hobby.color}
                    scallopSize="sm"
                  >
                    Watch a Video
                  </ScallopedButton>
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link
            href={`/discover/sampling/${hobbySlug}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            See all sampling options
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
