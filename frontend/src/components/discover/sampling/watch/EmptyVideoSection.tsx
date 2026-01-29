"use client";

import { motion } from "framer-motion";
import { VideoLoadingState } from "./VideoLoadingState";
import { EmptyVideoState } from "./EmptyVideoState";
import { SamplingCTA } from "@/components/discover/sampling/SamplingCTA";

interface EmptyVideoSectionProps {
  loading: boolean;
  hobbyName: string;
  hobbySlug: string;
  onCommit?: () => void;
  committing?: boolean;
}

export function EmptyVideoSection({
  loading,
  hobbyName,
  hobbySlug,
  onCommit,
  committing,
}: EmptyVideoSectionProps) {
  return (
    <div className="text-center space-y-8 max-w-md w-full">
      {/* Loading / empty state */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {loading ? (
          <VideoLoadingState />
        ) : (
          <EmptyVideoState hobbyName={hobbyName} />
        )}
      </motion.div>

      {/* Divider */}
      {!loading && (
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <hr className="flex-1 border-gray-200" />
        </div>
      )}

      {/* CTA — only when not loading */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3"
        >
          <SamplingCTA
            hobbySlug={hobbySlug}
            hobbyName={hobbyName}
            currentPath="watch"
            onCommit={onCommit}
            committing={committing}
          />
        </motion.div>
      )}
    </div>
  );
}
