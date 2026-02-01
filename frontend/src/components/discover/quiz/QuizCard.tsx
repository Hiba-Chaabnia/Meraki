import type { QuizQuestion } from "@/lib/quizData";
import type { SectionTheme } from "@/lib/sectionTheme";
import type { Answers } from "@/lib/hooks/useQuiz";
import { QuestionCard } from "@/components/discover/quiz/QuestionCard";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

const VW_PER_Q = 24;

interface QuizCardProps {
  questions: QuizQuestion[];
  answers: Answers;
  isActive: boolean;
  isDesktop: boolean;
  cardWidth: number;
  theme: SectionTheme;
  onSelectSingle: (questionId: number, option: string) => void;
  onToggleMulti: (questionId: number, option: string) => void;
  onSetText: (questionId: number, value: string) => void;
  showSubmit?: boolean;
  onSubmit?: () => void;
  /** Internal padding of the questions area in px. Defaults to 24 (= p-6). */
  questionsPadding?: number;
  /** Gap between question columns in desktop mode in px. Defaults to 24 (= gap-6). */
  questionsGap?: number;
}

export function QuizCard({
  questions,
  answers,
  isActive,
  isDesktop,
  cardWidth,
  theme,
  onSelectSingle,
  onToggleMulti,
  onSetText,
  showSubmit,
  onSubmit,
  questionsPadding = 24,
  questionsGap = 28,
}: QuizCardProps) {
  return (
    <div
      className={`h-full flex-shrink-0 px-2 py-3 flex flex-col justify-center transition-all duration-500 transform-gpu ${isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-20"
        }`}
      style={{ width: `${cardWidth}vw` }}
    >
      <div className="relative w-full max-h-full">
        {/* Card shell — shrinks to content, centered by flex parent */}
        <div
          className="w-full max-h-full rounded-3xl border shadow-lg overflow-y-auto hide-scrollbar relative bg-white"
          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        >
          {/* Questions area */}
          <div
            className={isDesktop ? "flex flex-row items-center justify-center" : "flex flex-col"}
            style={{
              padding: `${questionsPadding}px`,
              paddingBottom: `${Math.max(questionsPadding - 8, 0)}px`,
              gap: `${questionsGap}px`,
            }}
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

          {/* Mobile Submit Button */}
          {!isDesktop && showSubmit && onSubmit && (
            <div className="px-6 pb-2">
              <Button
                onClick={onSubmit}
                variant="secondary"
                fullWidth
                className="shadow-md font-bold"
              >
                Submit
              </Button>
            </div>
          )}

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

        {/* Submit Button - Desktop: Right of card, bottom aligned */}
        {isDesktop && showSubmit && onSubmit && (
          <div className="absolute left-full bottom-0 ml-[4.5rem] z-50">
            <motion.div
              animate={{ rotate: [0, -3, 3, -2, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              whileHover={{ rotate: 0, scale: 1.05 }}
            >
              <Button
                onClick={onSubmit}
                variant="secondary"
                size="lg"
                className="shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                Submit
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
