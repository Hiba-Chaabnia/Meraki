"use client";

import { useId } from "react";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { CARD_THEMES } from "@/lib/sectionTheme";

interface SectionMarkerProps {
  /** Zero-based section index — drives both the printed number and the colour. */
  index: number;
  size?: number;
  className?: string;
}

/**
 * The numbered flower that opens each legal section.
 *
 * Colour alternates blue / lime by index, which is the same `idx % 2` rhythm
 * the quiz, match and pathway cards use — it's what stops a wall of legal text
 * from reading as a generic document.
 */
export function SectionMarker({
  index,
  size = 34,
  className = "",
}: SectionMarkerProps) {
  const theme = CARD_THEMES[index % 2];

  // Each instance needs its own gradientId: FlowerShape derives its clipPath id
  // from it, so a page with a dozen markers sharing the default string silently
  // loses the clip and renders plain squares.
  const uid = useId().replace(/:/g, "");

  return (
    <span
      aria-hidden="true"
      className={[
        "relative inline-flex items-center justify-center flex-shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
    >
      <FlowerShape
        color={theme.accent}
        size={size}
        gradientId={`legal-marker-${uid}`}
        className="absolute inset-0"
      />
      <span
        className="relative font-semibold leading-none"
        style={{ fontSize: size * 0.4, color: theme.textOnAccent }}
      >
        {index + 1}
      </span>
    </span>
  );
}
