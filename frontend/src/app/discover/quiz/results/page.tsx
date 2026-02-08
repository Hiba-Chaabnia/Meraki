"use client";

import { useQuizMatches } from "@/hooks/useQuizMatches";
import { MatchesCarousel } from "@/components/discover/quiz-results/MatchesCarousel";
import { NoMatchesState } from "@/components/discover/quiz-results/NoMatchesState";
import { ResultsLoading } from "@/components/discover/sampling/ResultsLoading";

export default function QuizResultsPage() {
  const { matches, loading } = useQuizMatches();

  if (loading) return <ResultsLoading />;
  if (!matches || matches.length === 0) return <NoMatchesState />;

  return (
    <MatchesCarousel
      matches={matches}
      retakeHref="/discover/quiz"
      dashboardHref="/dashboard"
    />
  );
}
