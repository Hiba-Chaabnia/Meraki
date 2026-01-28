import { PlayIcon } from "@/components/ui/Icons";
import type { Video } from "./types";

interface VideoListItemProps {
  video: Video;
  isSelected: boolean;
  onSelect: () => void;
}

export function VideoListItem({
  video,
  isSelected,
  onSelect,
}: VideoListItemProps) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`flex gap-4 p-4 rounded-xl transition-all text-left w-full ${isSelected
            ? "border border-[var(--white-100)]"
            : "border border-[var(--white-100)] hover:border-[var(--white-200)]"
          }`}
      >
        <div
          className="w-28 self-stretch rounded-lg flex-shrink-0 bg-cover bg-center"
          style={{
            backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : undefined,
          }}
        >
          {!video.thumbnail && (
            <div className="w-full h-full flex items-center justify-center">
              <PlayIcon className="w-6 h-6 bg-[var(--secondary-light)]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{video.title}</p>
          <p className="text-xs text-gray-400 mt-1">{video.channel} · {video.duration}</p>
        </div>
      </button>
      {/* Tooltip — appears to the left on desktop hover */}
      <div className="pointer-events-none absolute right-full top-0 mr-2 hidden lg:group-hover:block w-72 bg-white border border-[var(--white-200)] rounded-xl shadow-lg p-4 z-10">
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
