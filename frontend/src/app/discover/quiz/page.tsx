"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/lib/hooks/useQuiz";
import type { SectionTheme } from "@/components/discover/sectionTheme";
import { FlowerShape } from "@/components/ui/FlowerShape";
import { ScallopedButton } from "@/components/ui/ScallopedButton";
import { saveQuizResponses } from "@/app/actions/quiz";
import { QuizStepper } from "@/components/discover/QuizStepper";
import { QuizCard } from "@/components/discover/QuizCard";
import { ChevronLeftIcon, ChevronRightIcon, RotateIcon } from "@/components/discover/QuizIcons";

/* ─── Layout constants (vw) ─── */
const VW_PER_Q = 24;
const VW_PAD = 6;
const MOBILE_CARD_W = 88;

const CARD_THEMES: [SectionTheme, SectionTheme] = [
  { bg: "#EBF2FE", accent: "#5396F4", border: "#BAD5FB", light: "#D6E8FD", textOnAccent: "#ffffff" },
  { bg: "#f5f9e0", accent: "#CFE251", border: "#DDEB85", light: "#EBF4B8", textOnAccent: "#292929" },
];

export default function QuizPage() {
  const router = useRouter();
  const quiz = useQuiz();
  const savedRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);

  /* Responsive breakpoint */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Save + redirect on submit */
  useEffect(() => {
    if (!quiz.isSubmitted || savedRef.current) return;
    savedRef.current = true;

    let cancelled = false;

    const save = async () => {
      const responses = Object.entries(quiz.answers)
        .map(([qId, answer]) => ({
          questionId: Number(qId),
          answer: Array.isArray(answer)
            ? answer.filter((v) => v.trim().length > 0)
            : [answer],
        }))
        .filter((r) => r.answer.length > 0);

      try {
        const result = await saveQuizResponses(responses);
        if (result?.error) {
          console.error("Quiz save error:", result.error);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          // Server action aborted — retry once without abort risk
          try {
            await saveQuizResponses(responses);
          } catch {
            // best-effort, navigate regardless
          }
        } else {
          console.error("Failed to save quiz data:", e);
        }
      }

      if (!cancelled) router.push("/discover/quiz/results?analyzing=true");
    };

    save();

    return () => { cancelled = true; };
  }, [quiz.isSubmitted, quiz.answers, router]);

  /* Card widths & centering offsets (in vw) */
  const { cardWidths, offsets } = useMemo(() => {
    const widths = quiz.sectionQuestions.map((sq) =>
      isDesktop ? sq.length * VW_PER_Q + VW_PAD : MOBILE_CARD_W,
    );
    const offs = widths.map((_, idx) => {
      const prev = widths.slice(0, idx).reduce((a, b) => a + b, 0);
      return 50 - prev - widths[idx] / 2;
    });
    return { cardWidths: widths, offsets: offs };
  }, [quiz.sectionQuestions, isDesktop]);

  const lastIndex = quiz.sections.length - 1;
  const showSubmit = quiz.activeIndex === lastIndex && quiz.allComplete;

  /* Loading screen after submit */
  if (quiz.isSubmitted) {
    return (
      <div className="h-[100dvh] bg-[var(--background)] flex items-center justify-center">
        <FlowerShape size={40} useGradient spin spinDuration={3} gradientId="loading-flower" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--background)] flex flex-col">
      {/* ── Stepper ── */}
      <QuizStepper
        sections={quiz.sections}
        activeIndex={quiz.activeIndex}
        maxReachedIndex={quiz.maxReachedIndex}
        completedSections={quiz.completedSections}
        onNavigate={quiz.navigateTo}
      />

      {/* ── Carousel viewport ── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* Navigation arrows — desktop only */}
        {isDesktop && (
          <>
            <button
              onClick={() => quiz.navigateTo(quiz.activeIndex - 1)}
              disabled={quiz.activeIndex === 0}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full border transition-all duration-300 ${
                quiz.activeIndex > 0
                  ? "bg-white/80 border-[var(--foreground)]/10 text-[var(--foreground)] hover:bg-white cursor-pointer opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => quiz.navigateTo(quiz.activeIndex + 1)}
              disabled={quiz.activeIndex >= quiz.maxReachedIndex}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full border transition-all duration-300 ${
                quiz.activeIndex < quiz.maxReachedIndex
                  ? "bg-white/80 border-[var(--foreground)]/10 text-[var(--foreground)] hover:bg-white cursor-pointer opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Card strip */}
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu"
          style={{ transform: `translateX(${offsets[quiz.activeIndex]}vw)` }}
        >
          {quiz.sections.map((section, cardIdx) => (
            <QuizCard
              key={section.id}
              section={section}
              sectionIndex={cardIdx}
              questions={quiz.sectionQuestions[cardIdx]}
              answers={quiz.answers}
              isActive={cardIdx === quiz.activeIndex}
              isDesktop={isDesktop}
              cardWidth={cardWidths[cardIdx]}
              theme={CARD_THEMES[cardIdx % 2]}
              onSelectSingle={quiz.selectSingle}
              onToggleMulti={quiz.toggleMulti}
              onSetText={quiz.setText}
            />
          ))}
        </div>

        {/* Submit button — desktop: positioned to the right of the last card */}
        {isDesktop && showSubmit && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-40"
            style={{ left: `calc(50vw + ${cardWidths[lastIndex] / 2}vw + 1vw)` }}
          >
            <ScallopedButton
              bgColor="var(--primary)"
              textColor="var(--background)"
              scallopSize="sm"
              onClick={quiz.handleSubmit}
            >
              Finish Quiz
            </ScallopedButton>
          </div>
        )}
      </div>

      {/* Submit button — mobile: centered below carousel */}
      {!isDesktop && showSubmit && (
        <div className="flex justify-center py-2 flex-shrink-0">
          <ScallopedButton
            bgColor="var(--primary)"
            textColor="var(--background)"
            scallopSize="sm"
            onClick={quiz.handleSubmit}
          >
            Finish Quiz
          </ScallopedButton>
        </div>
      )}

      {/* ── Reset button — always reserves space to prevent layout shift ── */}
      <div className="flex justify-center py-3 flex-shrink-0">
        <button
          onClick={quiz.handleRestart}
          className={`group flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
            Object.keys(quiz.answers).length > 0
              ? "text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 border-[var(--foreground)]/10 hover:border-[var(--foreground)]/20"
              : "invisible"
          }`}
          disabled={Object.keys(quiz.answers).length === 0}
        >
          <span className="group-hover:-rotate-180 transition-transform duration-500">
            <RotateIcon />
          </span>
          <span>Restart</span>
        </button>
      </div>
    </div>
  );
}
