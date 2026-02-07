"use client";

import { useState, useEffect, useRef } from "react";

/* eslint-disable @next/next/no-img-element */

const HOBBY_ICON_NAMES = [
  "painting.png",
  "embroidery.png",
  "mic.png",
  "sewing-machine.png",
  "calligraphy.png",
  "terrarium.png",
  "bouquet.png",
  "rocking-horse.png",
  "mandala.png",
  "craft.png",
  "origami.png",
  "paper-boat.png",
  "glassblowing.png",
  "sculpting.png",
  "beads.png",
  "book.png",
  "jewelery making.png",
  "candles.png",
  "ballet.png",
  "letter.png",
  "photo-camera.png",
  "whisk.png",
  "watering-can.png",
  "ceramic.png",
  "guitar.png",
  "acting.png",
  "chef-hat.png",
  "knitting.png",
  "plant.png",
  "piano.png",
  "paint-palette.png",
  "macrame.png",
  "pottery.png",
  "spray-paint.png",
  "ceramic-tiles.png",
  "hand.png",
];

type Placement = {
  idx: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
};

interface HeroIconPatternProps {
  /** Whether to apply the radial gradient mask. Default: true */
  useMask?: boolean;
  /** Icon set to use: 'primary' or 'secondary'. Default: 'primary' */
  iconSet?: "primary" | "secondary";
  /** Opacity of the icons. Default: 1 */
  iconOpacity?: number;
  /**
   * Target gap in px between icon centres. Given, the grid is measured from
   * this element's own box instead of the window, so the pattern keeps one
   * density at any container size — which is what a card inside a responsive
   * column needs, and what a viewport-sized grid cannot give it. Left off, the
   * grid comes from the window, which is what the full-bleed hero panels want.
   */
  iconSpacing?: number;
  /** Icon edge in px. The 58 default is tuned for full-viewport panels. */
  iconSize?: number;
}

/* Responsive breakpoints: fewer columns on narrow screens */
function getGridSize(width: number): { cols: number; rows: number } {
  if (width < 640) return { cols: 5, rows: 12 };
  if (width < 1024) return { cols: 8, rows: 12 };
  return { cols: 14, rows: 12 };
}

function computePlacements(cols: number, rows: number): Placement[] {
  const total = HOBBY_ICON_NAMES.length;
  const placements: Placement[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const isOdd = r % 2 === 1;
    const rowCols = isOdd ? cols - 1 : cols;
    const offset = isOdd ? 100 / (cols * 2) : 0;
    for (let c = 0; c < rowCols; c++) {
      placements.push({
        idx: n % total,
        x: (c + 0.5) * (100 / cols) + offset,
        y: (r + 0.5) * (100 / rows),
        rotate: isOdd ? 8 : -8,
        scale: 1,
      });
      n++;
    }
  }
  return placements;
}

export default function HeroIconPattern({
  useMask = true,
  iconSet = "primary",
  iconOpacity = 1,
  iconSpacing,
  iconSize = 58,
}: HeroIconPatternProps) {
  const measured = iconSpacing !== undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewportGrid, setViewportGrid] = useState({ cols: 14, rows: 12 });
  const [boxGrid, setBoxGrid] = useState<{ cols: number; rows: number } | null>(null);

  useEffect(() => {
    // A measured grid follows its own box, so the window has nothing to say.
    if (measured) return;
    function handleResize() {
      setViewportGrid(getGridSize(window.innerWidth));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measured]);

  useEffect(() => {
    const el = rootRef.current;
    if (iconSpacing === undefined || !el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoxGrid({
        cols: Math.max(1, Math.round(width / iconSpacing)),
        rows: Math.max(1, Math.round(height / iconSpacing)),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [iconSpacing]);

  const cols = boxGrid?.cols ?? viewportGrid.cols;
  const rows = boxGrid?.rows ?? viewportGrid.rows;
  /* Nothing until the box has been measured — one empty frame beats a flash of
     the viewport-sized grid at the wrong density. */
  const placements = measured && !boxGrid ? [] : computePlacements(cols, rows);

  // Build icon paths based on iconSet prop
  const iconBasePath = `/icons/hobbies-${iconSet}`;

  // Mask style - only apply if useMask is true
  const maskStyle = useMask ? {
    mask: "radial-gradient(ellipse 50% 45% at 50% 50%, transparent 0%, black 100%)",
    WebkitMask: "radial-gradient(ellipse 50% 45% at 50% 50%, transparent 0%, black 100%)",
  } : {};

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        opacity: 1,
        ...maskStyle,
      }}
    >
      {placements.map((p, i) => (
        <img
          key={`${cols}-${rows}-${i}`}
          src={`${iconBasePath}/${HOBBY_ICON_NAMES[p.idx]}`}
          alt=""
          width={iconSize}
          height={iconSize}
          className="absolute object-contain"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(-50%, -50%) rotate(${p.rotate}deg) scale(${p.scale})`,
            opacity: iconOpacity,
          }}
        />
      ))}
    </div>
  );
}
