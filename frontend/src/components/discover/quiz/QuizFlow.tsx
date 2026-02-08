"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuiz, type Answers } from "@/lib/hooks/useQuiz";
import { CARD_THEMES } from "@/lib/sectionTheme";
import { QuizStepper } from "./QuizStepper";
import { QuizCard } from "./QuizCard";
import { ChevronLeftIcon, ChevronRightIcon, RotateIcon } from "./QuizIcons";

/* ─── Layout constants (vw) ─── */
const VW_PER_Q = 24;
const VW_PAD = 2;
const MOBILE_CARD_W = 88;

export interface QuizFlowProps {
  /**
   * Fired once, when the last section is submitted. The caller decides what
   * happens next — the app saves and navigates, the preview only navigates.
   */
  onComplete: (answers: Answers) => void;
}

/**
 * The quiz carousel: stepper, card strip, arrows and restart.
 *
 * Owns the quiz state itself, so a caller only has to say what "done" means.
 */
export function QuizFlow({ onComplete }: QuizFlowProps) {
  const quiz = useQuiz();
  const completedRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);

  /* Responsive breakpoint */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!quiz.isSubmitted || completedRef.current) return;
    completedRef.current = true;
    onComplete(quiz.answers);
  }, [quiz.isSubmitted, quiz.answers, onComplete]);

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

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--background)] flex flex-col">
      {/* ── Headline ── */}
      <div className="pt-4 pb-2 text-center z-10">
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--foreground)]">
          Find a hobby you’ll actually enjoy — without overthinking it
        </h1>
        <p className="text-base font-medium text-[var(--foreground)]">
          Answer a few simple questions about your time, budget, and preferences. No right or wrong answers. Just honest preferences.
        </p>
      </div>

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
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full border transition-all duration-300 ${quiz.activeIndex > 0
                ? "bg-white/80 border-[var(--foreground)]/10 text-[var(--foreground)] hover:bg-white cursor-pointer opacity-100"
                : "opacity-0 pointer-events-none"
                }`}
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => quiz.navigateTo(quiz.activeIndex + 1)}
              disabled={quiz.activeIndex >= quiz.maxReachedIndex}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full border transition-all duration-300 ${quiz.activeIndex < quiz.maxReachedIndex
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
              questions={quiz.sectionQuestions[cardIdx]}
              answers={quiz.answers}
              isActive={cardIdx === quiz.activeIndex}
              isDesktop={isDesktop}
              cardWidth={cardWidths[cardIdx]}
              theme={CARD_THEMES[cardIdx % 2]}
              onSelectSingle={quiz.selectSingle}
              onToggleMulti={quiz.toggleMulti}
              onSetText={quiz.setText}
              showSubmit={cardIdx === lastIndex && quiz.allComplete}
              onSubmit={quiz.handleSubmit}
            />
          ))}
        </div>
      </div>

      {/* ── Reset button — always reserves space to prevent layout shift ── */}
      <div className="flex justify-center py-3 flex-shrink-0">
        <button
          onClick={quiz.handleRestart}
          className={`group flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${Object.keys(quiz.answers).length > 0
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
