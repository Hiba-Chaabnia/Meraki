import { Button } from "@/components/ui/Button";
import { CONTACT_EMAIL, formatUpdatedShort, getOtherDoc } from "@/lib/legal";
import { THEME_PRIMARY } from "@/lib/sectionTheme";
import type { LegalDoc } from "@/lib/legal/types";
import { LegalHeader } from "./LegalHeader";
import { LegalRail } from "./LegalRail";
import { SectionMarker } from "./SectionMarker";
import { LEGAL_SPACING } from "./spacing";

interface LegalPageProps {
  doc: LegalDoc;
  /**
   * Route prefix for the document links, so the previews can mount the exact
   * same component under /preview without forking it.
   */
  basePath?: string;
  homeHref?: string;
}

/** Prose and the contact card share one measure so the column edge is even. */
const MEASURE = { maxWidth: `${LEGAL_SPACING.measureCh}ch` };

/**
 * The shared shell both legal documents render into.
 *
 * Fixed top bar, then two columns: the document on the left, contents on the
 * right. Right is the convention for in-page navigation — a left rail reads as
 * site navigation, and the document switcher already lives in the header.
 *
 * Colour is fixed, not per-document: the contents rail and the contact card
 * are always blue; the date chip and the header's cross-link to the sibling
 * document are always green, styled after the "Search YouTube" fallback
 * button (see LegalHeader's doc comment). Privacy and Terms used to take
 * opposite halves of the blue/lime rhythm, alternating per document — that's
 * gone now; only the in-body numbered section markers still alternate blue/
 * lime by index.
 *
 * Deliberately not a client component — only the bar and the rail need the
 * browser, and each is its own small island. The body, which is most of the
 * bytes, renders on the server.
 *
 * Two layout rules worth not undoing:
 *  - No `max-w-*` wrapper. The page is full-bleed with a plain gutter, like
 *    PageLayout; the width cap belongs on the text (`measureCh`). See §5.0 of
 *    src/CLAUDE.md.
 *  - The column split is flex, not `lg:grid-cols-[Npx_1fr]` — earlier previews
 *    in this repo hit arbitrary `lg:` grid templates being silently absent from
 *    the compiled stylesheet.
 */
export function LegalPage({ doc, basePath = "", homeHref = "/" }: LegalPageProps) {
  const other = getOtherDoc(doc.slug);
  const railSections = doc.sections.map((s) => ({ id: s.id, title: s.title }));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <LegalHeader
        homeHref={homeHref}
        otherLabel={other.title}
        otherHref={`${basePath}/${other.slug}`}
      />

      {/* Clears the fixed bar */}
      <div style={{ paddingTop: LEGAL_SPACING.headerH }}>
        <div
          className="w-full"
          style={{
            paddingLeft: LEGAL_SPACING.gutterX,
            paddingRight: LEGAL_SPACING.gutterX,
            paddingTop: LEGAL_SPACING.shellY,
            paddingBottom: LEGAL_SPACING.shellY,
          }}
        >
          <div
            className="flex flex-col lg:flex-row"
            style={{ gap: LEGAL_SPACING.columnGap }}
          >
            <article className="min-w-0 flex-1">
              {/* Title + date chip. Chip styled like LegalHeader's cross-link
                  button — same green formula, same reason (lime text is
                  unreadable, so the ink is `--foreground`, not the accent). */}
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
                style={{ ...MEASURE, marginBottom: LEGAL_SPACING.introGap }}
              >
                {doc.intro}
              </div>

              {doc.sections.map((section, i) => (
                <section
                  key={section.id}
                  id={section.id}
                  style={{
                    marginBottom: LEGAL_SPACING.sectionGap,
                    /* Keeps an anchored heading clear of the fixed bar */
                    scrollMarginTop:
                      LEGAL_SPACING.headerH + LEGAL_SPACING.stickyOffset,
                  }}
                >
                  <div
                    className="flex items-center"
                    style={{
                      gap: LEGAL_SPACING.markerGap,
                      marginBottom: LEGAL_SPACING.sectionHeadingGap,
                    }}
                  >
                    <SectionMarker index={i} />
                    <h2 className="card-heading text-lg md:text-xl">
                      {section.title}
                    </h2>
                  </div>
                  <div className="legal-prose" style={MEASURE}>
                    {section.body}
                  </div>
                </section>
              ))}

              {/* Contact — an invitation, not a clause, so it sits outside the
                  numbering as a themed card. Always blue, matching the
                  contents rail, regardless of document. Shares the prose
                  measure: running it full width while the paragraphs stop
                  short is what made the column look unfinished. */}
              <div
                className="rounded-3xl border text-center"
                style={{
                  ...MEASURE,
                  padding: LEGAL_SPACING.contactPad,
                  backgroundColor: THEME_PRIMARY.bg,
                  borderColor: THEME_PRIMARY.accent,
                }}
              >
                <h2 className="card-heading text-lg md:text-xl">
                  {doc.contact.heading}
                </h2>
                <p className="legal-prose-plain text-sm md:text-[15px] text-gray-600 leading-relaxed mt-2.5 max-w-[46ch] mx-auto">
                  {doc.contact.body}
                </p>
                <div className="mt-6">
                  <Button href={`mailto:${CONTACT_EMAIL}`} variant="primary">
                    Contact Us
                  </Button>
                </div>
              </div>
            </article>

            <LegalRail sections={railSections} />
          </div>
        </div>
      </div>
    </div>
  );
}
