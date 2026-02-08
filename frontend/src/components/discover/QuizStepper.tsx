import type { QuizSection } from "@/lib/quizData";
import { FlowerShape } from "@/components/ui/FlowerShape";

const PRIMARY = "var(--primary)";
const PRIMARY_LIGHT = "var(--primary-light)";
const SECONDARY = "var(--secondary)";
const SECONDARY_LIGHT = "var(--secondary-light)";
const GRAY = "var(--gray)";

interface QuizStepperProps {
  sections: QuizSection[];
  activeIndex: number;
  maxReachedIndex: number;
  completedSections: boolean[];
  onNavigate: (idx: number) => void;
}

export function QuizStepper({
  sections,
  activeIndex,
  maxReachedIndex,
  completedSections,
  onNavigate,
}: QuizStepperProps) {
  return (
    <div className="flex justify-center items-center gap-2 pt-8 pb-4 px-4 border-2 border-red-500">
      {sections.map((section, idx) => {
        const isCompleted = completedSections[idx];
        const canNav = idx <= maxReachedIndex;
        const isPrimary = idx % 2 === 0;

        const accent = isPrimary ? PRIMARY : SECONDARY;
        const light = isPrimary ? PRIMARY_LIGHT : SECONDARY_LIGHT;

        const color = !canNav
          ? GRAY
          : isCompleted
            ? accent
            : canNav
              ? light
              : GRAY;

        const isActive = idx === activeIndex;
        const size = isActive ? 30 : 24;

        return (
          <button
            key={section.id}
            onClick={() => onNavigate(idx)}
            disabled={!canNav}
            className={`outline-none transition-all duration-300 ${canNav ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
          >
            <FlowerShape
              color={color}
              size={size}
              gradientId={`stepper-${idx}`}
            />
          </button>
        );
      })}
    </div>
  );
}
