"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { LEGAL_SPACING } from "./spacing";

interface LegalHeaderProps {
  /** Landing page — where the logo goes. */
  homeHref: string;
  /** The other document: "Terms of Service" from privacy, and vice versa. */
  otherLabel: string;
  otherHref: string;
}

/** Same on both documents — there's nothing left to vary per-document. */
const LOGO_SRC = "/icons/logo/logo-colorful.svg";

/**
 * Fixed top bar: logo on the left, a link to the sibling document on the right.
 *
 * The document switcher used to live in the left rail; putting it here means
 * it's reachable at any scroll depth, and leaves the rail to do one job.
 *
 * The cross-link button is styled after the "Search YouTube" fallback button
 * (components/discover/sampling/watch/EmptyVideoState.tsx) — pale tinted fill,
 * soft border, rounded-xl, hover:shadow-lg + active:scale-95 — recoloured green
 * (the secondary theme) rather than blue. Text is `--foreground`, not the raw
 * lime accent: lime as small text is close to unreadable (~1.3:1), the same
 * reason SectionTheme.textOnAccent forces dark ink for lime elsewhere.
 */
export function LegalHeader({
  homeHref,
  otherLabel,
  otherHref,
}: LegalHeaderProps) {
  // At the top of the page the header sits on bare cream, same as the body
  // behind it, so a visible seam there reads as a stray line under a title
  // rather than a boundary. Once content is scrolling underneath, the seam is
  // what tells the fixed bar apart from the page — so it fades in.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 bg-[var(--background)]/90 backdrop-blur-sm border-b transition-colors duration-200"
      style={{
        height: LEGAL_SPACING.headerH,
        borderColor: scrolled ? "var(--white-soft)" : "transparent",
      }}
    >
      {/* Full-bleed, sharing the page's gutter so the logo lines up with the
          document's left edge. No max-w container — see §5.0 of src/CLAUDE.md */}
      <div
        className="h-full w-full flex items-center justify-between gap-4"
        style={{
          paddingLeft: LEGAL_SPACING.gutterX,
          paddingRight: LEGAL_SPACING.gutterX,
        }}
      >
        <Link href={homeHref} className="no-underline" aria-label="Meraki home">
          <Image
            src={LOGO_SRC}
            alt="Meraki"
            width={116}
            height={32}
            className="object-contain"
            priority
          />
        </Link>

        <Link
          href={otherHref}
          className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[13px] font-semibold no-underline transition-all hover:shadow-lg active:scale-95"
          style={{
            backgroundColor: "var(--secondary-theme-bg)",
            borderColor: "var(--secondary-theme-border)",
            color: "var(--foreground)",
          }}
        >
          {otherLabel}
          <ArrowLeftIcon className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>
    </header>
  );
}
