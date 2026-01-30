"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import { PUBLIC_API_URL } from "@/lib/config";
import { triggerSamplingPreview, type SamplingPreviewResult } from "@/app/actions/sampling";
import { MicroActivityCard } from "@/components/discover/sampling/micro/MicroActivityCard";
import type { MicroActivity } from "@/components/discover/sampling/micro/types";

// Module-level cache — survives unmount/remount during client-side navigation
const activityCache = new Map<string, MicroActivity>();

export default function MicroPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobbyName = formatSlug(hobbySlug);

  const cached = activityCache.get(hobbySlug) ?? null;
  const [activity, setActivity] = useState<MicroActivity | null>(cached);
  const [loading, setLoading] = useState(!cached);

  const searchParams = useSearchParams();

  useEffect(() => {
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
        try {
          sessionStorage.setItem(`sampling-preview-${hobbySlug}`, JSON.stringify(data));
        } catch { /* sessionStorage unavailable */ }
        setActivity(act);
      }
      setLoading(false);
    }

    async function pollBackend(jobId: string) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${PUBLIC_API_URL}/sampling/preview/${jobId}`);
          if (cancelled) return;
          if (!res.ok) {
            if (pollTimer) clearInterval(pollTimer);
            setLoading(false);
            return;
          }
          const data = await res.json();
          if (data.status === "completed" && data.result) {
            if (pollTimer) clearInterval(pollTimer);
            applyActivity(data.result);
          } else if (data.status === "failed") {
            if (pollTimer) clearInterval(pollTimer);
            setLoading(false);
          }
        } catch {
          if (pollTimer) clearInterval(pollTimer);
          if (!cancelled) setLoading(false);
        }
      }, 2000);
    }

    async function loadActivity() {
      // 0. Check sessionStorage for data passed from parent page
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
            setLoading(false);
            return;
          }
        }
      } catch { /* sessionStorage unavailable */ }

      // 1. If jobId is in the URL (passed from parent), poll it directly
      const jobIdParam = searchParams.get("jobId");
      if (jobIdParam) {
        try {
          const res = await fetch(`${PUBLIC_API_URL}/sampling/preview/${jobIdParam}`);
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
        } catch { /* fall through to trigger new */ }
      }

      // 2. Check sessionStorage for a previously-started job ID
      try {
        const storedJobId = sessionStorage.getItem(`sampling-job-${hobbySlug}`);
        if (storedJobId) {
          const res = await fetch(`${PUBLIC_API_URL}/sampling/preview/${storedJobId}`);
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

      // 3. Trigger a new preview job
      const { job_id, error } = await triggerSamplingPreview(hobbySlug);
      if (cancelled) return;
      if (error || !job_id) {
        setLoading(false);
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
    <PageLayout
      title="Micro Activity"
      subtitle={`A tiny taste of ${hobbyName.toLowerCase()} — no materials needed, just you.`}
      backHref={`/discover/sampling/${hobbySlug}`}
      backLabel="Back to sampling options"
    >
      <div className="max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[var(--secondary)] animate-spin" />
              <p className="text-sm text-gray-400">Preparing your activity…</p>
            </div>
          </div>
        ) : activity ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <MicroActivityCard
              instruction={activity.instruction}
              duration={activity.duration}
              whyItWorks={activity.why_it_works}
              hobbySlug={hobbySlug}
              hobbyName={hobbyName}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-gray-400">No activity available. Try again later.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
