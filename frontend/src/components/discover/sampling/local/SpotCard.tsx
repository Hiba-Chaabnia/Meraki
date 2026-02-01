import { motion } from "framer-motion";
import { type LocalSpot } from "@/app/actions/sampling";
import { MapPinIcon, StarIcon, ExternalLinkIcon, DollarIcon } from "@/components/ui/Icons";
import { type SectionTheme } from "@/lib/sectionTheme";

interface SpotCardProps {
  spot: LocalSpot;
  theme: SectionTheme;
  index: number;
}

export function SpotCard({ spot, theme, index }: SpotCardProps) {
  // Determine the Learn More URL
  const learnMoreUrl = spot.url
    ? spot.url
    : spot.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="rounded-2xl border-2 border-green-400 p-6 flex flex-col bg-white"
    >
      <div className="flex flex-col gap-3 flex-1">
        {/* Row 1: Name + Type badge */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold tracking-normal text-gray-800 min-w-0 truncate">
            {spot.name}
          </p>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border"
            style={{ backgroundColor: theme.light, color: theme.accent, borderColor: theme.border }}
          >
            {spot.type}
          </span>
        </div>

        {/* Row 2: Address + Rating */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          {spot.address && (
            <span className="flex items-center gap-1.5 min-w-0">
              <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{spot.address}</span>
            </span>
          )}
          {spot.rating && (
            <span className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
              {spot.rating} {spot.reviews_count ? `(${spot.reviews_count})` : ""}
            </span>
          )}
        </div>

        {/* Row 3: Price */}
        {spot.price && (
          <div className="flex items-center gap-1 text-sm text-gray-500 font-medium min-w-0">
            <DollarIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{spot.price}</span>
          </div>
        )}

        {/* Row 4: Learn More button (full width, pinned to bottom) */}
        {learnMoreUrl ? (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.textOnAccent ?? "#fff" }}
          >
            Learn More
            <ExternalLinkIcon className="w-4 h-4" />
          </a>
        ) : (
          <button
            className="mt-auto w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.textOnAccent ?? "#fff" }}
          >
            Learn More
          </button>
        )}
      </div>
    </motion.div>
  );
}
