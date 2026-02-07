import type { QuizSection, QuizQuestion } from "@/lib/quizData";
import type { SectionTheme } from "@/components/discover/sectionTheme";
import type { Answers } from "@/lib/hooks/useQuiz";
import { QuestionCard } from "@/components/discover/QuestionCard";

const VW_PER_Q = 24;

interface QuizCardProps {
  section: QuizSection;
  sectionIndex: number;
  questions: QuizQuestion[];
  answers: Answers;
  isActive: boolean;
  isDesktop: boolean;
  cardWidth: number;
  theme: SectionTheme;
  onSelectSingle: (questionId: number, option: string) => void;
  onToggleMulti: (questionId: number, option: string) => void;
  onSetText: (questionId: number, value: string) => void;
}

export function QuizCard({
  section,
  sectionIndex,
  questions,
  answers,
  isActive,
  isDesktop,
  cardWidth,
  theme,
  onSelectSingle,
  onToggleMulti,
  onSetText,
}: QuizCardProps) {
  return (
    <div
      className={`h-full flex-shrink-0 px-2 py-3 flex flex-col justify-center transition-all duration-500 transform-gpu ${
        isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-20"
      }`}
      style={{ width: `${cardWidth}vw` }}
    >
      {/* Card shell — shrinks to content, centered by flex parent */}
      <div
        className="w-full rounded-3xl border shadow-lg overflow-y-auto hide-scrollbar"
        style={{ backgroundColor: theme.bg, borderColor: theme.border }}
      >
        {/* Questions area */}
        <div
          className={`p-6 pb-4 ${
            isDesktop
              ? "flex flex-row items-start gap-6"
              : "flex flex-col gap-8"
          }`}
        >
          {questions.map((q, qIdx) => (
            <div
              key={q.id}
              className={isDesktop ? "flex-shrink-0" : ""}
              style={isDesktop ? { width: `${VW_PER_Q - 2}vw` } : undefined}
            >
              <QuestionCard
                question={q}
                index={qIdx}
                answer={answers[q.id]}
                theme={theme}
                onSelectSingle={onSelectSingle}
                onToggleMulti={onToggleMulti}
                onSetText={onSetText}
              />
            </div>
          ))}
        </div>

        {/* Card footer */}
        <div className="px-6 pb-4 flex items-center">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: answers[q.id] ? 20 : 12,
                    backgroundColor: answers[q.id] ? theme.accent : theme.border,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-tight">
              {questions.filter((q) => !!answers[q.id]).length} of{" "}
              {questions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
