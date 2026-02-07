"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getHobby } from "@/lib/hobbyData";
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

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const ExternalLinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

interface Video {
  title: string;
  channel: string;
  url: string;
  thumbnail?: string;
  duration: string;
  why_good: string;
  what_to_watch_for?: string;
}

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobby = getHobby(hobbySlug);
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  // Poll the backend directly from the browser (no server action needed for GET)
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function applyVideos(data: SamplingPreviewResult) {
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
        setSelectedVideo(data.videos[0]);
      }
      setLoading(false);
    }

    async function pollBackend(jobId: string) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/sampling/preview/${jobId}`);
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
      // 1. If jobId is in the URL (passed from parent page), poll it directly
      const jobIdParam = searchParams.get("jobId");
      if (jobIdParam) {
        try {
          const res = await fetch(`${BACKEND_URL}/sampling/preview/${jobIdParam}`);
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
        } catch {
          // Job not found or backend down — fall through to trigger new
        }
      }

      // 2. No jobId or job not found — trigger a new one via server action
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6">
        <Link
          href={`/discover/sampling/${hobbySlug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sampling options
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ backgroundColor: hobby.lightColor }}
          >
            <PlayIcon className="w-8 h-8" style={{ color: hobby.color }} />
          </div>
          <h1 className="!text-3xl md:!text-4xl mb-4">
            Watch {hobby.name} in Action
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Get a feel for what {hobby.name.toLowerCase()} looks like before you try it yourself.
            No commitment, just inspiration.
          </p>
        </motion.div>

        {videos && videos.length > 0 ? (
          <>
            {/* Main video player */}
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                  {getYouTubeId(selectedVideo.url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.url)}`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <a
                        href={selectedVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:underline"
                      >
                        Open video <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="!text-lg font-semibold mb-2">{selectedVideo.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {selectedVideo.channel} · {selectedVideo.duration}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Why this video:</p>
                      <p className="text-sm text-gray-500">{selectedVideo.why_good}</p>
                    </div>
                    {selectedVideo.what_to_watch_for && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">What to watch for:</p>
                        <p className="text-sm text-gray-500">{selectedVideo.what_to_watch_for}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Video list */}
            {videos.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4">
                  More videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVideo(video)}
                      className={`flex gap-4 p-4 rounded-xl border transition-all text-left ${
                        selectedVideo === video
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div
                        className="w-24 h-16 rounded-lg flex-shrink-0 bg-cover bg-center"
                        style={{
                          backgroundColor: hobby.lightColor,
                          backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : undefined,
                        }}
                      >
                        {!video.thumbnail && (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayIcon className="w-6 h-6" style={{ color: hobby.color }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{video.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{video.channel} · {video.duration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          /* Fallback when no videos loaded */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="aspect-video rounded-2xl overflow-hidden mb-8"
            style={{ backgroundColor: hobby.lightColor }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin w-10 h-10 border-3 border-gray-200 border-t-gray-500 rounded-full mx-auto mb-4" />
                    <p className="text-gray-500">Finding the best videos for you...</p>
                    <p className="text-sm text-gray-400 mt-2">
                      This may take a moment while our AI curates beginner-friendly content
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: hobby.color }}
                    >
                      <PlayIcon className="w-10 h-10 text-white ml-1" />
                    </div>
                    <p className="text-gray-500">No curated videos available yet</p>
                    <Link
                      href={`/discover/sampling/${hobbySlug}`}
                      className="text-sm text-gray-400 mt-2 hover:text-gray-600 underline"
                    >
                      Go back to generate personalized recommendations
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* What you'll see - only show if no videos */}
        {(!videos || videos.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 p-8"
          >
            <h2 className="!text-xl mb-4">What you&apos;ll see</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: hobby.color }} />
                A beginner-friendly introduction to {hobby.name.toLowerCase()}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: hobby.color }} />
                The basic tools and materials you&apos;d need to get started
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: hobby.color }} />
                What a typical session looks like from start to finish
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: hobby.color }} />
                Tips from experienced hobbyists
              </li>
            </ul>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-gray-400 text-sm mb-4">
            Ready to try it yourself?
          </p>
          <Link
            href={`/discover/sampling/${hobbySlug}/micro`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: "var(--lavender)" }}
          >
            Try a Micro Activity
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
