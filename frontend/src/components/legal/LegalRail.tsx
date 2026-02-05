"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { THEME_PRIMARY } from "@/lib/sectionTheme";
import { LEGAL_SPACING } from "./spacing";

export interface RailSection {
  id: string;
  title: string;
}

interface LegalRailProps {
  sections: RailSection[];
  /** Preview-only: seeds the highlight so galleries show the active state. */
  initialActiveId?: string;
}

/**
 * Borrows the row structure of the analyzing screen's step list — see
 * components/discover/quiz/AnalyzingSteps.tsx — flower marker on a fixed rail,
 * label beside it, state read from colour and size.
 *
 * Deliberately simpler than that component: no check icons and no motion. A
 * table of contents is read at a glance and returned to constantly, so a
 * spinning marker would pull the eye away from the text; and "done" would be a
 * lie, since scrolling past a section isn't reading it. One indicator, for
 * where you are.
 *
 * Only the label is undimmed — inactive text uses the app's normal body-text
 * ink, not a washed-out grey. The inactive flower stays pale (`--primary-
 * lighter`), matching how it read before this rail had colour states at all;
 * the active row gets the primary blue (matching the rail's own card), not
 * lime:
 *
 *   active    solid primary blue, 26px, label in primary blue + semibold
 *   inactive  pale `--primary-lighter`, 16px, label in normal `text-gray-700`
 */
type ItemState = "active" | "inactive";

const SIZE: Record<ItemState, number> = { active: 26, inactive: 16 };

const COLOR: Record<ItemState, string> = {
  active: "var(--primary)",
  inactive: "var(--primary-lighter)",
};

const LABEL: Record<ItemState, string> = {
  active: "text-[var(--primary)] font-semibold",
  inactive: "text-gray-700",
};

/** Rail must fit the largest marker so labels stay aligned across states. */
const RAIL = Math.max(24, ...Object.values(SIZE));

/** Clear the fixed bar, plus a little breathing room. */
const SCROLL_OFFSET = LEGAL_SPACING.headerH + LEGAL_SPACING.stickyOffset;

export function LegalRail({ sections, initialActiveId }: LegalRailProps) {
  const [activeId, setActiveId] = useState(
    initialActiveId ?? sections[0]?.id ?? ""
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Topmost intersecting section wins, so the highlight tracks reading
        // position rather than whichever entry happened to fire last.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: `-${SCROLL_OFFSET + 8}px 0px -68% 0px`, threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sections]);

  function goTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return; // let the browser follow the href as a fallback
    e.preventDefault();

    // Smooth-scrolls and respects the section's scroll-margin-top, so the
    // heading lands clear of the fixed bar rather than under it.
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);

    setActiveId(id);
    setMobileOpen(false);
  }

  const list = (
    <ol className="space-y-1">
      {sections.map((section) => {
        const state: ItemState =
          section.id === activeId ? "active" : "inactive";

        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => goTo(e, section.id)}
              aria-current={state === "active" ? "location" : undefined}
              className="flex items-center gap-3 rounded-lg py-1.5 px-1.5 no-underline transition-colors hover:bg-[var(--white-muted)]"
            >
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: RAIL, height: RAIL }}
              >
                <FlowerShape
                  size={SIZE[state]}
                  color={COLOR[state]}
                  gradientId={`legal-toc-${section.id}`}
                />
              </span>

              <span
                className={`text-sm leading-snug whitespace-nowrap transition-colors ${LABEL[state]}`}
              >
                {section.title}
                {state === "active" && (
                  <span className="sr-only"> — current section</span>
                )}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Desktop rail, pinned to the RIGHT of the document (`lg:order-1` puts
          it after the article, which sits at the default order 0).

          Right is the convention for in-page navigation — a left rail reads as
          site navigation, and the document switcher lives in the header. */}
      <aside
        className="hidden lg:block lg:order-1 flex-shrink-0"
        style={{ width: LEGAL_SPACING.railWidth }}
      >
        {/* No visible heading — the markers and position make the purpose
            obvious. aria-label keeps it named for screen readers.

            Always blue, on both documents — see LegalPage's doc comment.
            Matches AnalyzingSteps' default `container="card"`: rounded-2xl,
            primary theme fill and border. */}
        <nav
          className="sticky rounded-2xl border p-4"
          style={{
            top: SCROLL_OFFSET,
            backgroundColor: THEME_PRIMARY.bg,
            borderColor: THEME_PRIMARY.accent,
          }}
          aria-label="On this page"
        >
          {list}
        </nav>
      </aside>

      {/* Mobile disclosure. `order-first` keeps it above the document when the
          row collapses to a column — the desktop rail's `lg:order-1` would
          otherwise drag it below. The label stays here: it's the control's
          only affordance when collapsed. Border is the same blue as the
          desktop card, for the same reason. */}
      <div className="lg:hidden order-first mb-8">
        <details
          open={mobileOpen}
          onToggle={(e) => setMobileOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-2xl border bg-white/60 backdrop-blur-sm"
          style={{ borderColor: THEME_PRIMARY.border }}
        >
          <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
              On this page
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform ${
                mobileOpen ? "rotate-180" : ""
              }`}
            />
          </summary>
          <div className="px-2 pb-3">{list}</div>
        </details>
      </div>
    </>
  );
}
