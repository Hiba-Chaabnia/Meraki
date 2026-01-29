import { PlayIcon } from "@/components/ui/Icons";
import type { Video } from "./types";

interface VideoListItemProps {
  video: Video;
  isSelected: boolean;
  onSelect: () => void;
  isLast?: boolean;
}

export function VideoListItem({
  video,
  isSelected,
  onSelect,
  isLast = false,
}: VideoListItemProps) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`flex items-top gap-2 p-2 rounded-xl transition-all text-left w-full ${isSelected
            ? "border border-[var(--white-soft)]"
            : "border border-[var(--white-muted)] hover:border-[var(--white-soft)]"
          }`}
      >
        <div
          className="w-30 h-18 rounded-lg flex-shrink-0 bg-cover bg-center"
          style={{
            backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : undefined,
          }}
        >
          {!video.thumbnail && (
            <div className="w-full h-full flex items-center justify-center bg-[var(--primary-light)] rounded-xl">
              <PlayIcon className="w-6 h-6 text-[var(--primary)]" />
            </div>
          )}

        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{video.title}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <span className="truncate">{video.channel}</span>
            <span className="flex-shrink-0">· {video.duration}</span>
          </div>
        </div>
      </button>
      {/* Tooltip — appears to the left on desktop hover */}
      <div className={`pointer-events-none absolute right-full mr-2 hidden lg:group-hover:block w-72 bg-[var(--white)] border border-[var(--white-soft)] rounded-xl shadow-lg p-4 z-10 ${isLast ? "top-1/2 -translate-y-1/2" : "top-0"}`}>
        <p className="text-sm font-medium text-gray-700 mb-1">Why this video:</p>
        <p className="text-sm text-gray-500">{video.why_good}</p>
        {video.what_to_watch_for && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-1">What to watch for:</p>
            <p className="text-sm text-gray-500">{video.what_to_watch_for}</p>
          </div>
        )}
      </div>
    </div>
  );
}
