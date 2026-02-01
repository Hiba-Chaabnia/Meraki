"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import { CLIENT_API_URL } from "@/lib/config";
import {
  triggerSamplingPreview,
  type SamplingPreviewResult,
} from "@/app/actions/sampling";
import type { Video } from "@/components/discover/sampling/watch/types";
import { VideoDisplaySection } from "@/components/discover/sampling/watch/VideoDisplaySection";
import { EmptyVideoSection } from "@/components/discover/sampling/watch/EmptyVideoSection";
import { useCommit } from "@/hooks/useCommit";

// Module-level cache — survives unmount/remount during client-side navigation
const videosCache = new Map<string, Video[]>();

export default function WatchPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = { name: formatSlug(hobbySlug), color: "#374151", lightColor: "#F3F4F6" };

  const cached = videosCache.get(hobbySlug) ?? null;
  const [videos, setVideos] = useState<Video[] | null>(cached);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(cached?.[0] ?? null);
  const [loading, setLoading] = useState(!cached);
  const { handleCommit, committing, committed, commitError } = useCommit(hobbySlug);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (videosCache.has(hobbySlug)) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function applyVideos(data: SamplingPreviewResult) {
      if (data.videos && data.videos.length > 0) {
        videosCache.set(hobbySlug, data.videos);
        try {
          sessionStorage.setItem(`sampling-preview-${hobbySlug}`, JSON.stringify(data));
        } catch { /* sessionStorage unavailable */ }
        setVideos(data.videos);
        setSelectedVideo(data.videos[0]);
      }
      setLoading(false);
    }

    async function pollBackend(jobId: string) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${CLIENT_API_URL}/sampling/preview/${jobId}`);
          if (cancelled) return;
          if (!res.ok) {
            if (pollTimer) clearInterval(pollTimer);
            setLoading(false);
            return;
          }
          const data = await res.json();
          if (data.status === "completed" && data.result) {
            if (pollTimer) clearInterval(pollTimer);
            applyVideos(data.result);
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

    async function loadVideos() {
      // 0. Check sessionStorage for data passed from parent page
      try {
        const stored = sessionStorage.getItem(`sampling-preview-${hobbySlug}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.videos && parsed.videos.length > 0) {
            videosCache.set(hobbySlug, parsed.videos);
            setVideos(parsed.videos);
            setSelectedVideo(parsed.videos[0]);
            setLoading(false);
            return;
          }
        }
      } catch { /* sessionStorage unavailable */ }

      // 1. If jobId is in the URL (passed from parent), poll it directly
      const jobIdParam = searchParams.get("jobId");
      if (jobIdParam) {
        try {
          const res = await fetch(`${CLIENT_API_URL}/sampling/preview/${jobIdParam}`);
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" && data.result) {
              applyVideos(data.result);
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
          const res = await fetch(`${CLIENT_API_URL}/sampling/preview/${storedJobId}`);
          if (!cancelled && res.ok) {
            const data = await res.json();
            if (data.status === "completed" && data.result) {
              applyVideos(data.result);
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

    loadVideos();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [hobbySlug, searchParams]);


  const hasVideos = videos && videos.length > 0 && selectedVideo;

  const [devState, setDevState] = useState<'auto' | 'loading' | 'error' | 'success'>('auto');

  const showSuccess = devState === 'success' || (devState === 'auto' && hasVideos);
  const showLoading = devState === 'loading' || (devState === 'auto' && loading);

  return (
    <PageLayout
      title={`Watch ${hobby.name} in Action`}
      subtitle="Get a feel for what this hobby looks like before you try it yourself. No commitment, just inspiration."
      backHref={`/discover/sampling/${hobbySlug}`}
      backLabel="Back to sampling options"
    >
      <div className="w-full flex-1 flex flex-col">
        {/* Error toast */}
        {commitError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl shadow-lg"
          >
            <span>⚠</span>
            {commitError}
          </motion.div>
        )}

        {committed ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center max-w-sm w-full space-y-6"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                🎉
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {hobby.name} is now on your list!
                </h2>
                <p className="text-gray-500 text-sm">
                  Head to your dashboard to log your first session and start your journey.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
                style={{ backgroundColor: "#374151" }}
              >
                Go to Dashboard
              </Link>
            </motion.div>
          </div>
        ) : showSuccess && hasVideos ? (
          <VideoDisplaySection
            videos={videos}
            selectedVideo={selectedVideo}
            onSelectVideo={setSelectedVideo}
            hobbySlug={hobbySlug}
            hobbyName={hobby.name}
            onCommit={handleCommit}
            committing={committing}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyVideoSection
              loading={showLoading}
              hobbyName={hobby.name}
              hobbySlug={hobbySlug}
              onCommit={handleCommit}
              committing={committing}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
