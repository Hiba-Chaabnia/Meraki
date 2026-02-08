import type { SectionTheme } from "@/components/discover/sectionTheme";

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  theme: SectionTheme;
  onClick: () => void;
}

export function QuizOption({ option, isSelected, theme, onClick }: QuizOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 border text-left flex justify-between items-center border-2 border-orange-500 ${isSelected
          ? "shadow-md scale-[1.02]"
          : "bg-white/80 text-[var(--foreground)] hover:bg-white"
        }`}
      style={
        isSelected
          ? { backgroundColor: theme.accent, borderColor: theme.accent, color: theme.textOnAccent || "#ffffff" }
          : { borderColor: theme.border }
      }
    >
      <span>{option}</span>
      {isSelected && (
        <span
          className="w-1.5 h-1.5 rounded-full opacity-60"
          style={{ backgroundColor: theme.textOnAccent || "#ffffff" }}
        />
      )}
    </button>
  );
}
