"use client";

import { motion } from "framer-motion";
import type { Video } from "./types";
import { VideoPlayer } from "./VideoPlayer";
import { VideoListItem } from "./VideoListItem";
import { SamplingCTA } from "@/components/discover/sampling/SamplingCTA";

interface SamplingSectionProps {
  videos: Video[];
  selectedVideo: Video | null;
  onSelectVideo: (video: Video) => void;
  hobbySlug: string;
  hobbyName: string;
  onCommit: () => void;
  committing: boolean;
}

export function VideoDisplaySection({
  videos,
  selectedVideo,
  onSelectVideo,
  hobbySlug,
  hobbyName,
  onCommit,
  committing,
}: SamplingSectionProps) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-8">
      {/* Left column — player only */}
      <div>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <VideoPlayer url={selectedVideo.url} title={selectedVideo.title} />
          </motion.div>
        )}
      </div>

      {/* Right column — video list + CTA */}
      <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className=""
        >
          <div>
            <div className="space-y-3">
              {videos.filter((v) => v !== selectedVideo).slice(0, 5).map((video, index) => (
                <VideoListItem
                  key={index}
                  video={video}
                  isSelected={selectedVideo === video}
                  onSelect={() => onSelectVideo(video)}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex-1 flex items-center">
          <hr className="w-full border-gray-200" />
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-auto space-y-3"
        >
          <SamplingCTA
            hobbySlug={hobbySlug}
            hobbyName={hobbyName}
            currentPath="watch"
            onCommit={onCommit}
            committing={committing}
          />
        </motion.div>
      </div>
    </div>
  );
}
