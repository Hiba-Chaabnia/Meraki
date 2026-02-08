import type { SectionTheme } from "@/components/discover/sectionTheme";

interface QuizQuestionHeaderProps {
  index: number;
  text: string;
  optional?: boolean;
  isAnswered: boolean;
  type: "single" | "multi" | "text";
  maxSelections?: number;
  theme: SectionTheme;
}

export function QuizQuestionHeader({
  text,
  optional,
  type,
  maxSelections,
  theme,
}: QuizQuestionHeaderProps) {
  return (
    <div className="w-full min-h-[4.5rem] flex flex-col justify-between border-2 border-lime-500">
      <p className="text-sm md:text-base font-semibold text-[var(--foreground)] leading-tight border border-pink-500">
        {text}
      </p>

      <div className="flex justify-end w-full gap-2 border border-cyan-500">
        {optional && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1.5"
            style={{ color: theme.accent, borderColor: theme.border }}
          >
            Optional
          </span>
        )}
        {type === "multi" ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1.5"
            style={{ color: theme.accent, borderColor: theme.border }}
          >
            {maxSelections
              ? `Select up to ${maxSelections}`
              : "Select all that apply"}
          </span>
        ) : type === "single" ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1.5"
            style={{ color: theme.accent, borderColor: theme.border }}
          >
            Select one
          </span>
        ) : null}
      </div>
    </div>
  );
}
