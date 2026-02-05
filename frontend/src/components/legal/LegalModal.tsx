"use client";

import { Modal } from "@/components/ui/Modal";
import { XIcon } from "@/components/ui/Icons";
import { formatUpdatedShort } from "@/lib/legal";
import type { LegalDoc } from "@/lib/legal/types";
import { SectionMarker } from "./SectionMarker";
import { LEGAL_SPACING } from "./spacing";

interface LegalModalProps {
  doc: LegalDoc;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The full document, read inline instead of visited as a page — for the one
 * place that happens: the sign-up agreement checkbox. Everything that only
 * makes sense as a standalone page is gone: no fixed header (nothing to
 * navigate to inside a modal — the "other document" link belongs to the page,
 * not this), no contents rail (nothing to scroll past when it's all one
 * scrollable panel), no contact card (this isn't where someone goes to get in
 * touch). Just the title, the date chip, and the text.
 *
 * Reuses LEGAL_SPACING's title/chip/section rhythm so the proportions match
 * the full page — same document, same numbers, smaller frame.
 *
 * NOT using Modal's `scrollable` prop. That puts `overflow-y-auto` on the same
 * element as `rounded-2xl`, and Chromium does not reliably clip border-radius
 * on an element that owns a native scrollbar — confirmed here: computed
 * `border-radius` was correct (16px) but the rendered corners were square. The
 * standard fix is to split the two jobs: the radius lives on Modal's own
 * static panel (which now clips via `overflow-hidden`, see ui/Modal.tsx), the
 * scrollbar on a plain inner div here with no radius of its own.
 *
 * That split also puts the close button above the scrolling div rather than
 * inside it, so it stays reachable at every scroll position instead of
 * scrolling away on a document this long.
 *
 * Background is the app's cream `--background`, not Modal's default white —
 * passed in rather than hardcoded in ui/Modal.tsx, since that's a shared
 * primitive used by modals elsewhere that still want white. Close-button
 * hover uses the primary theme (the same blue as the contents rail and
 * contact card on the full page), not the neutral grey ui/Modal's other
 * consumers use.
 */
export function LegalModal({ doc, isOpen, onClose }: LegalModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      backgroundColor="var(--background)"
    >
      <div className="flex justify-end px-6 pt-5 md:px-8 md:pt-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex-shrink-0 p-1.5 rounded-full text-gray-400 transition-colors hover:bg-[var(--primary-theme-bg)] hover:text-[var(--primary-theme-accent)]"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-[80vh] overflow-y-auto px-6 pb-6 md:px-8 md:pb-8">
        <div style={{ marginBottom: LEGAL_SPACING.titleGap }}>
          <h1 className="page-title">{doc.title}</h1>
          <span
            className="inline-flex items-center rounded-xl border px-3 py-1 text-xs font-medium"
            style={{
              marginTop: LEGAL_SPACING.chipGap,
              backgroundColor: "var(--secondary-theme-bg)",
              borderColor: "var(--secondary-theme-border)",
              color: "var(--foreground)",
            }}
          >
            Updated{" "}
            <time dateTime={doc.updated} className="ml-1">
              {formatUpdatedShort(doc.updated)}
            </time>
          </span>
        </div>

        <div
          className="legal-prose"
          style={{ marginBottom: LEGAL_SPACING.introGap }}
        >
          {doc.intro}
        </div>

        {doc.sections.map((section, i) => (
          <section
            key={section.id}
            style={{ marginBottom: LEGAL_SPACING.sectionGap }}
          >
            <div
              className="flex items-center"
              style={{
                gap: LEGAL_SPACING.markerGap,
                marginBottom: LEGAL_SPACING.sectionHeadingGap,
              }}
            >
              <SectionMarker index={i} />
              <h2 className="card-heading text-lg">{section.title}</h2>
            </div>
            <div className="legal-prose">{section.body}</div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
