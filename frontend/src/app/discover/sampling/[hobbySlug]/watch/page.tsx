"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import type { Video } from "@/components/discover/sampling/watch/types";
import { VideoDisplaySection } from "@/components/discover/sampling/watch/VideoDisplaySection";
import { EmptyVideoSection } from "@/components/discover/sampling/watch/EmptyVideoSection";
import { useCommit } from "@/hooks/useCommit";
import { useSamplingPreview } from "@/hooks/useSamplingPreview";

export default function WatchPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobbyName = formatSlug(hobbySlug);
  const { previewResult, previewLoading } = useSamplingPreview(hobbySlug);
  const { handleCommit, committing, committed, commitError } = useCommit(hobbySlug);

  const videos: Video[] = previewResult?.videos ?? [];
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (!selectedVideo && videos.length > 0) setSelectedVideo(videos[0]);
  }, [videos, selectedVideo]);

  const hasVideos = videos.length > 0 && selectedVideo !== null;

  return (
    <PageLayout
      title={`Watch ${hobbyName} in Action`}
      subtitle="Get a feel for what this hobby looks like before you try it yourself. No commitment, just inspiration."
      backHref={`/discover/sampling/${hobbySlug}`}
      backLabel="Back to sampling options"
    >
      <div className="w-full flex-1 flex flex-col">
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
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl bg-gray-100">
                🎉
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {hobbyName} is now on your list!
                </h2>
                <p className="text-gray-500 text-sm">
                  Head to your dashboard to log your first session and start your journey.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gray-700 transition-all hover:shadow-lg active:scale-95"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          </div>
        ) : hasVideos ? (
          <VideoDisplaySection
            videos={videos}
            selectedVideo={selectedVideo!}
            onSelectVideo={setSelectedVideo}
            hobbySlug={hobbySlug}
            hobbyName={hobbyName}
            onCommit={handleCommit}
            committing={committing}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyVideoSection
              loading={previewLoading}
              hobbyName={hobbyName}
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
