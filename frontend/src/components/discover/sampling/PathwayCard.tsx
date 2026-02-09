import { motion } from "framer-motion";
import { CheckCircleIcon, StarIcon } from "@/components/ui/Icons";
import type { SectionTheme } from "@/components/discover/quiz/sectionTheme";

/* ─── Perk row ─── */
function Perk({ children, theme }: { children: React.ReactNode; theme: SectionTheme }) {
  return (
    <li className="flex items-start gap-2 text-[13px] text-gray-600 leading-snug">
      <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.accent }} />
      <span>{children}</span>
    </li>
  );
}

/* ─── Detail/Note Badge ─── */
function InfoBadge({ children, theme }: { children: React.ReactNode; theme: SectionTheme }) {
  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide border"
      style={{
        backgroundColor: theme.light,
        color: theme.accent,
        borderColor: theme.accent
      }}
    >
      {children}
    </span>
  );
}

/* ─── Recommended badge ─── */
function RecommendedBadge({ theme }: { theme: SectionTheme }) {
  return (
    <span 
    style={{
      backgroundColor: theme.accent,
      color: theme.light,
      borderColor: theme.light
    }}
    className="inline-flex items-center flex-shrink-0 gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ">
      <StarIcon className="w-3 h-3" />
      <em>Recommended</em>
    </span>
  );
}

/* ─── Main pathway card ─── */
export interface PathwayCardProps {
  title: string;
  description: string;
  perks: string[];
  details?: { label: string; value: string }[];
  note?: string;
  button: React.ReactNode;
  isRecommended?: boolean;
  theme: SectionTheme;
}

export function PathwayCard({
  title,
  description,
  perks,
  details,
  note,
  button,
  isRecommended,
  theme,
}: PathwayCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative h-full flex flex-col rounded-3xl border transition-all duration-300 hover:shadow-xl shadow-sm group bg-white/50 backdrop-blur-sm overflow-hidden ${isRecommended ? "ring-2 ring-amber-100" : ""
        }`}
      style={{
        borderColor: theme.accent,
        backgroundColor: theme.bg
      }}
    >
      <div className="p-5 flex flex-col h-full gap-4">

        {/* ROW 1: Title & Badge */}
        <div className="flex items-start justify-between gap-3 min-h-[32px]">
          <p className="text-xl font-bold leading-snug text-gray-900 line-clamp-2">
            {title}
          </p>
          {isRecommended && <RecommendedBadge theme={theme} />}
        </div>

        {/* ROW 2: Description | Perks | Notes (Rows) */}
        <div className="flex flex-col gap-4 flex-grow">

          {/* Row 2.1: Description */}
          <div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Row 2.2: Perks */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
              What you&apos;ll get
            </p>
            <ul className="space-y-2">
              {perks.map((perk, i) => (
                <Perk key={i} theme={theme}>{perk}</Perk>
              ))}
            </ul>
          </div>

          {/* Row 2.3: Notes (Details + Note) as Badges */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 content-start">
              {details?.map((d) => (
                <InfoBadge key={d.label} theme={theme}>
                  {d.label} {d.value}
                </InfoBadge>
              ))}
              {note && (
                <InfoBadge theme={theme}>
                  {note}
                </InfoBadge>
              )}
            </div>
          </div>

        </div>

        {/* ROW 3: Button */}
        <div className="mt-auto pt-2 w-full">
          {button}
        </div>
      </div>
    </motion.div>
  );
}
