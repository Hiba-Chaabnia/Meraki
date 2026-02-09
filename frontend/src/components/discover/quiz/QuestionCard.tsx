import type { QuizQuestion } from "@/lib/quizData";
import type { SectionTheme } from "@/components/discover/quiz/sectionTheme";
import { QuizQuestionHeader } from "@/components/discover/quiz/QuizQuestionHeader";
import { QuizOption } from "@/components/discover/quiz/QuizOption";

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  answer: string | string[] | undefined;
  theme: SectionTheme;
  onSelectSingle: (questionId: number, option: string) => void;
  onToggleMulti: (questionId: number, option: string) => void;
  onSetText: (questionId: number, value: string) => void;
}

export function QuestionCard({
  question: q,
  index,
  answer,
  theme,
  onSelectSingle,
  onToggleMulti,
  onSetText,
}: QuestionCardProps) {
  // Calculated height: Header (4.5rem) + Max Options (6) * Option Height (~3.5rem each with gap) = ~25.5rem
  // Adding a buffer to 26rem to ensure consistency on desktop (lg+).
  return (
    <div className="w-full flex flex-col items-start gap-4 lg:min-h-[26rem]">
      <QuizQuestionHeader
        index={index}
        text={q.text}
        optional={q.optional}
        isAnswered={!!answer}
        type={q.type}
        maxSelections={q.maxSelections}
        theme={theme}
      />

      {q.type === "text" && (
        <textarea
          className="w-full px-4 py-3 rounded-xl border bg-white/80 text-[var(--foreground)] text-sm resize-none outline-none transition-colors"
          style={{ borderColor: theme.border }}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)}
          placeholder={q.placeholder}
          rows={3}
          value={(answer as string) || ""}
          onChange={(e) => onSetText(q.id, e.target.value)}
        />
      )}

      {q.type !== "text" && (
        <div className="w-full grid grid-cols-1 gap-2">
          {q.options?.map((option) => {
            const isSelected =
              q.type === "single"
                ? answer === option
                : ((answer as string[]) || []).includes(option);

            return (
              <QuizOption
                key={option}
                option={option}
                isSelected={isSelected}
                theme={theme}
                onClick={() =>
                  q.type === "single"
                    ? onSelectSingle(q.id, option)
                    : onToggleMulti(q.id, option)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
