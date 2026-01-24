"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuizMatches } from "@/hooks/useQuizMatches";
import { MatchCard } from "@/components/discover/quiz-results/MatchCard";
import { NoMatchesState } from "@/components/discover/quiz-results/NoMatchesState";
import { ResultsLoading } from "@/components/discover/sampling/ResultsLoading";

import { QuizStepper } from "@/components/discover/quiz/QuizStepper";
import type { SectionTheme } from "@/components/discover/quiz/sectionTheme";

// Theme constants for alternating card styles
const CARD_THEMES: [SectionTheme, SectionTheme] = [
  { bg: "#EBF2FE", accent: "#5396F4", border: "#BAD5FB", light: "#D6E8FD", textOnAccent: "#ffffff" },
  { bg: "#f5f9e0", accent: "#CFE251", border: "#DDEB85", light: "#EBF4B8", textOnAccent: "#292929" },
];

const VW_CARD_DESKTOP = 28;
const MOBILE_CARD_W = 75;

export default function QuizResultsPage() {
  const router = useRouter();
  const { matches, loading } = useQuizMatches();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { cardWidths, offsets } = useMemo(() => {
    if (!matches) return { cardWidths: [], offsets: [] };
    const widths = matches.map(() =>
      isDesktop ? VW_CARD_DESKTOP : MOBILE_CARD_W
    );
    const offs = widths.map((w, idx) => {
      const stripPos = widths.slice(0, idx).reduce((a, b) => a + b, 0);

      let targetPos;
      if (isDesktop && matches.length > 1) {
        // Desktop: Interpolate alignment from left to right
        const t = idx / (matches.length - 1);
        const margin = 4; // Margin from screen edge in VW
        const start = margin;
        const end = 100 - w - margin; // Right align: 100vw - width - margin
        targetPos = start + (end - start) * t;
      } else {
        // Mobile or single card: Center alignment
        targetPos = 50 - w / 2;
      }

      return targetPos - stripPos;
    });
    return { cardWidths: widths, offsets: offs };
  }, [matches, isDesktop]);

  if (loading) return <ResultsLoading />;
  if (!matches || matches.length === 0) return <NoMatchesState />;

  const navigateTo = (index: number) => {
    if (index >= 0 && index < matches.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-[var(--background)] ">
      {/* Header */}
      <div className="pt-6 pb-2 text-center z-10">
        <p className="text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
          Your creative spark is calling
        </p>
        <p className="text-md md:text-lg font-medium text-[var(--foreground)]">
          Based on your answers, here are the hobbies we think you&apos;ll love.
        </p>
      </div>

      {/* Stepper underneath header */}
      <div className="flex justify-center items-center flex-shrink-0 pt-2 z-10">
        <QuizStepper
          sections={matches.map((_, i) => ({ id: i } as any))}
          activeIndex={activeIndex}
          maxReachedIndex={matches.length - 1}
          completedSections={matches.map(() => true)}
          onNavigate={navigateTo}
        />
      </div>

      {/* Carousel */}
      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col justify-center">

        <div
          className="flex items-start transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu"
          style={{ transform: `translateX(${offsets[activeIndex]}vw)` }}
        >
          {matches.map((match, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={match.slug}
                className={`h-[60vh] md:h-[55vh] max-h-full flex-shrink-0 px-6 py-3 flex flex-col justify-center transition-all duration-500 transform-gpu cursor-pointer`}
                style={{ width: `${cardWidths[idx]}vw` }}
                onClick={() => !isActive && navigateTo(idx)}
              >
                <div className={`h-full w-full ${isActive ? "" : "pointer-events-none"}`}>
                  <MatchCard
                    match={match}
                    index={idx}
                    theme={CARD_THEMES[idx % 2]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message underneath cards */}
      <div className="flex justify-center items-center flex-shrink-0 z-10 pb-6 text-[var(--foreground)]/60">
        <p className="text-sm">
          None of these hobbies speaks to you,{" "}
          <Link href="/discover/quiz" className="hover:text-primary font-medium">
            <em>retake quiz</em>
          </Link>
          {" "}or{" "}
          <Link href="/dashboard" className="hover:text-primary font-medium">
            <em>ship to dashboard</em>
          </Link>
        </p>
      </div>
    </div>
  );
}
